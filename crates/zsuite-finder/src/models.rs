use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;
use sha2::{Digest, Sha256};

const HOST: &str = "https://huggingface.co";

pub type Source<'a> = dyn Fn(&str) -> Result<Box<dyn Read>, String> + 'a;

pub struct Piece {
    pub remote: &'static str,
    pub local: &'static str,
    pub sha256: &'static str,
    pub size: u64,
}

pub struct Model {
    pub id: &'static str,
    pub folder: &'static str,
    pub repository: &'static str,
    pub revision: &'static str,
    pub pieces: &'static [Piece],
}

#[derive(Clone, Serialize)]
pub struct Progress {
    pub done: u64,
    pub total: u64,
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

impl Model {
    pub fn path(&self, models: &Path) -> PathBuf {
        models.join(self.folder)
    }

    pub fn present(&self, models: &Path) -> bool {
        let folder = self.path(models);
        self.pieces.iter().all(|piece| {
            fs::metadata(folder.join(piece.local)).is_ok_and(|meta| meta.len() == piece.size)
        })
    }

    pub fn verified(&self, models: &Path) -> bool {
        let folder = self.path(models);
        self.pieces.iter().all(|piece| {
            File::open(folder.join(piece.local)).is_ok_and(|mut file| {
                let mut hasher = Sha256::new();
                std::io::copy(&mut file, &mut hasher).is_ok()
                    && hex(&hasher.finalize()) == piece.sha256
            })
        })
    }

    fn total(&self) -> u64 {
        self.pieces.iter().map(|piece| piece.size).sum()
    }

    pub fn fetch(
        &self,
        models: &Path,
        read: &Source<'_>,
        stop: &AtomicBool,
        progress: &dyn Fn(Progress),
    ) -> Result<(), String> {
        let folder = self.path(models);
        fs::create_dir_all(&folder)
            .map_err(|error| format!("The download could not be saved: {error}"))?;
        let total = self.total();
        let mut done = 0;
        for piece in self.pieces {
            let target = folder.join(piece.local);
            if fs::metadata(&target).is_ok_and(|meta| meta.len() == piece.size) {
                done += piece.size;
                continue;
            }
            let partial = folder.join(format!("{}.part", piece.local));
            let fetched = (|| {
                let mut source = read(&format!(
                    "{HOST}/{}/resolve/{}/{}",
                    self.repository, self.revision, piece.remote
                ))?;
                let mut file = File::create(&partial).map_err(|error| error.to_string())?;
                let mut digest = Sha256::new();
                let mut buffer = vec![0; 1 << 16];
                let mut size = 0u64;
                loop {
                    if stop.load(Ordering::Relaxed) {
                        return Err("The download was cancelled.".to_string());
                    }
                    let read = source
                        .read(&mut buffer)
                        .map_err(|error| error.to_string())?;
                    if read == 0 {
                        break;
                    }
                    size += read as u64;
                    if size > piece.size {
                        return Err("The download is larger than expected.".into());
                    }
                    digest.update(&buffer[..read]);
                    file.write_all(&buffer[..read])
                        .map_err(|error| error.to_string())?;
                    progress(Progress {
                        done: done + size,
                        total,
                    });
                }
                file.sync_all().map_err(|error| error.to_string())?;
                if hex(&digest.finalize()) != piece.sha256 {
                    return Err("The download did not match what was expected. Try again.".into());
                }
                fs::rename(&partial, &target).map_err(|error| error.to_string())
            })();
            if let Err(error) = fetched {
                let _ = fs::remove_file(&partial);
                return Err(if error.starts_with("The ") {
                    error
                } else {
                    format!("The download failed: {error}")
                });
            }
            done += piece.size;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;
    use std::sync::Mutex;

    use super::*;

    const TINY: Model = Model {
        id: "tiny",
        folder: "tiny",
        repository: "someone/tiny",
        revision: "abc",
        pieces: &[Piece {
            remote: "nested/weights.bin",
            local: "weights.bin",
            sha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
            size: 5,
        }],
    };

    #[test]
    fn a_download_is_kept_only_when_its_checksum_matches() {
        let models = std::env::temp_dir().join(format!("zsuite-models-{}", std::process::id()));
        let _ = fs::remove_dir_all(&models);
        let asked = Mutex::new(Vec::new());
        let bad = |address: &str| -> Result<Box<dyn Read>, String> {
            asked.lock().unwrap().push(address.to_string());
            Ok(Box::new(Cursor::new(b"hellO".to_vec())))
        };
        assert!(
            TINY.fetch(&models, &bad, &AtomicBool::new(false), &|_| {})
                .unwrap_err()
                .contains("did not match")
        );
        assert!(!TINY.present(&models));
        assert!(!TINY.path(&models).join("weights.bin.part").exists());
        assert_eq!(
            asked.lock().unwrap()[0],
            "https://huggingface.co/someone/tiny/resolve/abc/nested/weights.bin"
        );
        let good = |_: &str| -> Result<Box<dyn Read>, String> {
            Ok(Box::new(Cursor::new(b"hello".to_vec())))
        };
        let seen = Mutex::new(Vec::new());
        TINY.fetch(&models, &good, &AtomicBool::new(false), &|step| {
            seen.lock().unwrap().push(step.done)
        })
        .unwrap();
        assert!(TINY.present(&models) && TINY.verified(&models));
        assert_eq!(*seen.lock().unwrap(), [5]);
        fs::write(TINY.path(&models).join("weights.bin"), "jello").unwrap();
        assert!(TINY.present(&models) && !TINY.verified(&models));
        let long = |_: &str| -> Result<Box<dyn Read>, String> {
            Ok(Box::new(Cursor::new(b"hello world".to_vec())))
        };
        fs::remove_file(TINY.path(&models).join("weights.bin")).unwrap();
        assert!(
            TINY.fetch(&models, &long, &AtomicBool::new(false), &|_| {})
                .unwrap_err()
                .contains("larger")
        );
    }
}
