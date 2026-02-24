use serde::Serialize;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Lock(String),
    Io(std::io::Error),
    Serialization(serde_json::Error),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Lock(msg) => write!(f, "Lock error: {}", msg),
            AppError::Io(err) => write!(f, "IO error: {}", err),
            AppError::Serialization(err) => write!(f, "Serialization error: {}", err),
        }
    }
}

impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Serialization(err)
    }
}
