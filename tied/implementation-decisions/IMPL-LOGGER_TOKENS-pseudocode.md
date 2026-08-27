# IMPL-LOGGER_TOKENS essence pseudocode

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: TypeScript logger API requires semantic tokens as first parameter with bracket formatting and dev-only validation

## Summary contract

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: every log method accepts tokens before message; formatTokens produces bracketed space-separated token segment in output

```
IMPL-LOGGER_TOKENS_Summary():
  INPUT: tokens string OR string[]; message string; optional metadata object
  OUTPUT: token segment embedded in file and console log lines
  DATA: SemanticToken type; PREFIX in REQ|ARCH|IMPL|TEST|PROC
  PRE: logger method invoked with tokens and message
  POST: formatted token segment included in log output
  EFFECTS: log IO; dev-only validation warnings
  CONTROL: validation skipped in production NODE_ENV
  TERMINATION: total
```

## TokenFirstLogMethodSignature

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: all logger methods require tokens as first parameter (string or string array), then message, optional metadata object

```
IMPL-LOGGER_TOKENS_TokenFirstLogMethodSignature(tokens, message, metadata):
  INPUT: tokens SemanticToken | SemanticToken[], message, metadata?
  OUTPUT: LogEntry.tokens as string array
  DATA: Logger interface method signatures
  PRE: tokens and message provided
  POST: LogEntry built and delegated to writeLog
  EFFECTS: IO via writeLog
  TERMINATION: total
  tokenArray := IF array THEN tokens ELSE [tokens]
  BUILD LogEntry with tokenArray
  DELEGATE to writeLog
```

## FormatTokensBracketWrap

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: normalize to array, wrap each token in brackets if missing, join with spaces for log output

```
IMPL-LOGGER_TOKENS_FormatTokensBracketWrap(tokens):
  INPUT: single token or array
  OUTPUT: space-separated bracketed tokens string e.g. "[REQ-LOGGING_SYSTEM] [IMPL-LOGGER_MODULE]"
  DATA: tokens already starting with "[" preserved without double wrap
  PRE: tokens argument provided
  POST: bracket-wrapped token string returned
  EFFECTS: pure; dev validation side effect
  TERMINATION: total
  tokenArray := normalize to array
  IF NODE_ENV !== production THEN FOR EACH token CALL validateToken
  FOR EACH token IF starts with "[" THEN keep ELSE wrap as "[token]"
  RETURN join with space
```

## ValidateTokenFormatDevOnly

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: in non-production NODE_ENV validate token against REQ|ARCH|IMPL|TEST|PROC pattern and console.warn on mismatch

```
IMPL-LOGGER_TOKENS_ValidateTokenFormatDevOnly(token):
  INPUT: token string
  OUTPUT: console.warn when pattern mismatch; no throw; no validation in production
  DATA: pattern /^\[?(REQ|ARCH|IMPL|TEST|PROC)-[A-Z_0-9]+\]?$/
  PRE: token string provided
  POST: warn emitted in dev on mismatch; silent in production
  EFFECTS: console warn (dev only)
  TERMINATION: total
  IF NODE_ENV is production THEN RETURN
  IF token matches pattern THEN RETURN
  console.warn invalid semantic token format with IMPL-LOGGER_TOKENS tag
```

## CodeLocations

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — formatTokens, validateToken, log() token normalization
// FILE: src/lib/logger.types.ts — SemanticToken type and Logger method signatures
// FILE: src/lib/logger.test.ts — Semantic Tokens describe
// FUNCTION: formatTokens, validateToken in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: invalid token format warns in development only; logging continues with unvalidated token text

```
IMPL-LOGGER_TOKENS_on_error(context, error):
  INPUT: invalid token format in development
  OUTPUT: console.warn; write path continues
  PRE: dev environment; token failed pattern
  POST: warning logged; no throw
  EFFECTS: console warn
  TERMINATION: total
  ON invalid format IN dev LOG console.warn CONTINUE write path
  IN production SKIP validation entirely for performance
```
