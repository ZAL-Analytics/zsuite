use crate::rules::rules;

pub fn words(line: &str) -> Vec<(usize, usize)> {
    let mut found = Vec::new();
    let mut start = None;
    for (at, c) in line.char_indices().chain([(line.len(), ' ')]) {
        match (c.is_whitespace(), start) {
            (false, None) => start = Some(at),
            (true, Some(from)) => {
                found.push((from, at));
                start = None;
            }
            _ => {}
        }
    }
    found
}

pub fn trimmed(line: &str, start: usize, end: usize) -> Option<(usize, usize)> {
    let piece = &line[start..end];
    let inner = piece.trim_matches(|c: char| !c.is_alphanumeric());
    if inner.is_empty() {
        return None;
    }
    let from = start + piece.find(inner)?;
    Some((from, from + inner.len()))
}

// Narrows a hit of the finder to what can be a name: it is split where a sentence ends, loses the
// lower-case words at either end ("het Microsoft account", "340 uur") and is dropped when nothing
// is left or only a common word is. Scripts without capitals keep every word.
fn sentences<'a>(text: &'a str, ends: &[String]) -> Vec<(usize, &'a str)> {
    let mut found = Vec::new();
    let mut from = 0;
    let mut at = 0;
    while at < text.len() {
        match ends.iter().find(|end| text[at..].starts_with(end.as_str())) {
            Some(end) => {
                found.push((from, &text[from..at]));
                at += end.len();
                from = at;
            }
            None => at += text[at..].chars().next().map_or(1, char::len_utf8),
        }
    }
    found.push((from, &text[from..]));
    found
}

fn capital(word: &str) -> bool {
    word.chars()
        .find(|c| c.is_alphabetic())
        .is_some_and(char::is_uppercase)
}

// A capital says nothing where every word has one (a heading, a title) or where a line or a
// bullet starts. There a single word is more often an ordinary word than a name. A sentence that
// starts inside a line is left alone: a name found once is hidden there again.
fn heading(line: &str) -> bool {
    let lettered: Vec<&str> = words(line)
        .into_iter()
        .map(|(from, to)| &line[from..to])
        .filter(|word| word.chars().any(char::is_alphabetic))
        .collect();
    let sentences = rules().is_ok_and(|rules| {
        rules
            .sentence_ends
            .iter()
            .any(|end| line.trim_end().contains(end.as_str()))
    });
    lettered.len() > 2 && lettered.iter().all(|word| capital(word)) && !sentences
}

fn opens(line: &str, from: usize) -> bool {
    let before = &line[..from];
    before.chars().all(|c| !c.is_alphabetic()) || before.trim_end().ends_with(':')
}

/// Whether the one capitalised word at `from..to` of `line` stands where a capital says nothing.
pub fn plain(line: &str, from: usize, to: usize) -> bool {
    let word = &line[from..to];
    words(word).len() == 1 && capital(word) && (heading(line) || opens(line, from))
}

pub fn cleaned(line: &str, start: usize, end: usize) -> Vec<(usize, usize)> {
    let Ok(rules) = rules() else {
        return vec![(start, end)];
    };
    let named = |(from, to): (usize, usize)| {
        line[from..to]
            .chars()
            .find(|c| c.is_alphabetic())
            .is_some_and(|c| !c.is_lowercase())
    };
    let heading = heading(line);
    let mut kept = Vec::new();
    for (offset, sentence) in sentences(&line[start..end], &rules.sentence_ends) {
        let at = start + offset;
        let spans: Vec<(usize, usize)> = words(sentence)
            .into_iter()
            .map(|(from, to)| (at + from, at + to))
            .collect();
        let edge = |&(from, to): &(usize, usize)| {
            named((from, to))
                && trimmed(line, from, to)
                    .is_some_and(|(from, to)| !rules.stopword(&line[from..to]))
        };
        let (Some(first), Some(last)) = (spans.iter().position(edge), spans.iter().rposition(edge))
        else {
            continue;
        };
        let Some((from, to)) = trimmed(line, spans[first].0, spans[last].1) else {
            continue;
        };
        let word = &line[from..to];
        if first == last && capital(word) && heading {
            continue;
        }
        if first == last && capital(word) && opens(line, from) {
            // "Esther Koster ..." opens a sentence and is still a name: the finder may only have
            // marked its first word.
            let next = words(&line[to..])
                .first()
                .and_then(|&(start, end)| trimmed(line, to + start, to + end))
                .filter(|&(start, end)| {
                    line[to..start].trim().is_empty()
                        && capital(&line[start..end])
                        && !rules.stopword(&line[start..end])
                });
            if let Some((_, end)) = next {
                kept.push((from, end));
            }
            continue;
        }
        kept.push((from, to));
    }
    kept
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn words_split_on_white_space_and_hits_lose_their_punctuation() {
        let line = "  Met Jan, at (Acme)  ";
        let spans: Vec<&str> = words(line)
            .iter()
            .map(|&(start, end)| &line[start..end])
            .collect();
        assert_eq!(spans, ["Met", "Jan,", "at", "(Acme)"]);
        assert_eq!(
            trimmed(line, 6, 10).map(|(start, end)| &line[start..end]),
            Some("Jan")
        );
        assert_eq!(
            trimmed(line, 14, 20).map(|(start, end)| &line[start..end]),
            Some("Acme")
        );
        assert_eq!(trimmed("-- --", 0, 5), None);
    }

    #[test]
    fn a_capital_that_only_opens_a_sentence_or_sits_in_a_heading_is_not_a_name() {
        let kept = |line: &str, word: &str| {
            let at = line.find(word).unwrap();
            cleaned(line, at, at + word.len())
                .into_iter()
                .map(|(start, end)| line[start..end].to_string())
                .collect::<Vec<_>>()
        };
        let line = "Kennis lekt weg. Marloes belt Heineken, zegt Frank.";
        assert!(kept(line, "Kennis").is_empty());
        assert_eq!(kept(line, "Marloes"), ["Marloes"]);
        assert_eq!(kept(line, "Heineken"), ["Heineken"]);
        assert_eq!(kept(line, "Frank"), ["Frank"]);
        assert!(kept("Stap 1: Kennis delen", "Kennis").is_empty());
        assert!(kept("2. Dubbel werk", "Dubbel").is_empty());
        assert!(kept("• Informatie staat overal", "Informatie").is_empty());
        assert!(kept("WAT WE BOUWEN", "WAT WE BOUWEN").is_empty());
        assert!(kept("Building Excellence, Timeless Quality.", "Timeless").is_empty());
        assert_eq!(
            kept("Bij Unilever Rotterdam", "Bij Unilever Rotterdam"),
            ["Unilever Rotterdam"]
        );
        assert_eq!(
            kept("Esther Koster belt morgen.", "Esther"),
            ["Esther Koster"]
        );
        assert_eq!(kept("Arsalan Anwari", "Arsalan Anwari"), ["Arsalan Anwari"]);
        assert!(plain("Kennis lekt weg", 0, 6) && !plain("Onze Kennis groeit", 5, 11));
    }

    #[test]
    fn a_hit_keeps_only_what_can_be_a_name() {
        let named = |line: &str, piece: &str| -> Vec<String> {
            let start = line.find(piece).unwrap();
            cleaned(line, start, start + piece.len())
                .into_iter()
                .map(|(from, to)| line[from..to].to_string())
                .collect()
        };
        let line = "zijn. Als de proef in Rotterdam uitloopt, ten name van Brouwer & Smit ICT.";
        assert!(named(line, "Als de proef").is_empty());
        assert_eq!(named(line, "van Brouwer & Smit"), ["Brouwer & Smit"]);
        let line = "het adres in het beheernetwerk van Hendriks. Monteurs gebruiken het";
        for ordinary in ["adres", "beheernetwerk", "het adres"] {
            assert!(named(line, ordinary).is_empty(), "{ordinary}");
        }
        assert_eq!(named(line, "Hendriks. Monteurs"), ["Hendriks", "Monteurs"]);
        assert!(named("Inrichting, 340 uur à € 95", "340 uur").is_empty());
        assert!(named("De meetdata", "De").is_empty());
        assert_eq!(
            named("met het Microsoft account van", "het Microsoft account"),
            ["Microsoft"]
        );
        assert_eq!(
            named("Proef in regio Rotterdam", "regio Rotterdam"),
            ["Rotterdam"]
        );
        assert_eq!(
            named("Fatima El Amrani is de enige", "Fatima El Amrani"),
            ["Fatima El Amrani"]
        );
        assert_eq!(named("التقى أحمد بسارة", "أحمد"), ["أحمد"]);
    }
}
