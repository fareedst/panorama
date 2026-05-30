# IMPL-LOGGER_TOKENS essence pseudocode

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: TypeScript logger API requires semantic tokens as first parameter with bracket formatting and dev-only validation

## Summary contract

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: every log method accepts tokens before message; formatTokens produces bracketed space-separated token segment in output

CONTRACT Summary
  INPUT: tokens string OR string[]; message string; optional metadata object
  OUTPUT: token segment embedded in file and console log lines
  DATA: SemanticToken type; PREFIX in REQ|ARCH|IMPL|TEST|PROC
  CONTROL: validation skipped in production NODE_ENV

## TokenFirstLogMethodSignature

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: all logger methods require tokens as first parameter (string or string array), then message, optional metadata object

CONTRACT TokenFirstLogMethodSignature
  INPUT: tokens SemanticToken | SemanticToken[], message, metadata?
  OUTPUT: LogEntry.tokens as string array
  DATA: Logger interface method signatures

PROCEDURE IMPL-LOGGER_TOKENS_TokenFirstLogMethodSignature(tokens, message, metadata)
  tokenArray := IF array THEN tokens ELSE [tokens]
  BUILD LogEntry with tokenArray
  DELEGATE to writeLog

## FormatTokensBracketWrap

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: normalize to array, wrap each token in brackets if missing, join with spaces for log output

CONTRACT FormatTokensBracketWrap
  INPUT: single token or array
  OUTPUT: space-separated bracketed tokens string e.g. "[REQ-LOGGING_SYSTEM] [IMPL-LOGGER_MODULE]"
  DATA: tokens already starting with "[" preserved without double wrap

PROCEDURE IMPL-LOGGER_TOKENS_FormatTokensBracketWrap(tokens)
  tokenArray := normalize to array
  IF NODE_ENV !== production THEN FOR EACH token CALL validateToken
  FOR EACH token IF starts with "[" THEN keep ELSE wrap as "[token]"
  RETURN join with space

## ValidateTokenFormatDevOnly

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: in non-production NODE_ENV validate token against REQ|ARCH|IMPL|TEST|PROC pattern and console.warn on mismatch

CONTRACT ValidateTokenFormatDevOnly
  INPUT: token string
  OUTPUT: console.warn when pattern mismatch; no throw; no validation in production
  DATA: pattern /^\[?(REQ|ARCH|IMPL|TEST|PROC)-[A-Z_0-9]+\]?$/

PROCEDURE IMPL-LOGGER_TOKENS_ValidateTokenFormatDevOnly(token)
  IF NODE_ENV is production THEN RETURN
  IF token matches pattern THEN RETURN
  console.warn invalid semantic token format with IMPL-LOGGER_TOKENS tag

## CodeLocations

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: map implementing and verifying source files for this IMPL

// FILE: src/lib/logger.ts — formatTokens, validateToken, log() token normalization
// FILE: src/lib/logger.types.ts — SemanticToken type and Logger method signatures
// FILE: src/lib/logger.test.ts — Semantic Tokens describe
// FUNCTION: formatTokens, validateToken in src/lib/logger.ts

## ErrorHandling

// [IMPL-LOGGER_TOKENS] [ARCH-LOGGING_SEMANTIC_TOKENS] [REQ-LOGGING_SEMANTIC_TOKENS]: how: invalid token format warns in development only; logging continues with unvalidated token text

PROCEDURE IMPL-LOGGER_TOKENS_on_error(context, error)
  ON invalid format IN dev LOG console.warn CONTINUE write path
  IN production SKIP validation entirely for performance
