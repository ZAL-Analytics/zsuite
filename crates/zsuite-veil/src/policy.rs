use serde::{Deserialize, Serialize};

use crate::STRICT;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Rule {
    Optional,
    Required,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Web {
    Allowed,
    Blocked,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Collection {
    Allow,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Policy {
    #[serde(rename = "$schema", default, skip_serializing)]
    pub schema: Option<String>,
    pub hide_names: Rule,
    pub find_names: Rule,
    pub hide_amounts: Rule,
    pub minimum_level: u8,
    pub web: Web,
    pub providers: Vec<String>,
    pub data_collection: Collection,
    pub zero_retention: bool,
}

impl Policy {
    pub fn strictest() -> Self {
        Self {
            schema: None,
            hide_names: Rule::Required,
            find_names: Rule::Optional,
            hide_amounts: Rule::Required,
            minimum_level: STRICT,
            web: Web::Blocked,
            providers: Vec::new(),
            data_collection: Collection::Deny,
            zero_retention: true,
        }
    }

    pub fn open() -> Self {
        Self {
            schema: None,
            hide_names: Rule::Optional,
            find_names: Rule::Optional,
            hide_amounts: Rule::Optional,
            minimum_level: 0,
            web: Web::Allowed,
            providers: Vec::new(),
            data_collection: Collection::Allow,
            zero_retention: false,
        }
    }

    pub fn parse(text: &str) -> Result<Self, String> {
        let policy: Self = serde_json::from_str(text).map_err(|error| error.to_string())?;
        if policy.minimum_level > STRICT {
            return Err("minimumLevel is above the strictest level".into());
        }
        Ok(policy)
    }

    pub fn allows(&self, provider: &str) -> bool {
        self.providers.iter().any(|allowed| allowed == provider)
    }

    pub fn web(&self) -> bool {
        self.web == Web::Allowed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"{
  "hideNames": "required",
  "findNames": "optional",
  "hideAmounts": "required",
  "minimumLevel": 1,
  "web": "allowed",
  "providers": ["claude"],
  "dataCollection": "deny",
  "zeroRetention": false
}"#;

    #[test]
    fn a_policy_is_read_and_a_broken_one_is_refused() {
        let policy = Policy::parse(SAMPLE).unwrap();
        assert_eq!(policy.hide_names, Rule::Required);
        assert_eq!(policy.minimum_level, 1);
        assert!(policy.allows("claude") && !policy.allows("custom") && policy.web());
        for broken in [
            "{}",
            r#"{"hideNames":"maybe"}"#,
            &SAMPLE.replace("\"minimumLevel\": 1", "\"minimumLevel\": 7"),
            &SAMPLE.replace("\"web\"", "\"wbe\""),
        ] {
            assert!(Policy::parse(broken).is_err(), "{broken}");
        }
        let fallback = Policy::strictest();
        assert_eq!(fallback.hide_names, Rule::Required);
        assert!(!fallback.web() && !fallback.allows("claude"));
    }

    #[test]
    fn the_schema_names_exactly_the_fields_of_a_policy() {
        let keys = |value: &serde_json::Value| -> std::collections::BTreeSet<String> {
            value.as_object().unwrap().keys().cloned().collect()
        };
        let schema: serde_json::Value =
            serde_json::from_str(include_str!("../resources/policy.schema.json")).unwrap();
        let mut sample: serde_json::Value = serde_json::from_str(SAMPLE).unwrap();
        sample["$schema"] = "x".into();
        assert_eq!(keys(&sample), keys(&schema["properties"]));
    }
}
