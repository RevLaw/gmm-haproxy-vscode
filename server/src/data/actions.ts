/**
 * HAProxy action sub-keywords for http-request, http-response,
 * http-after-response, tcp-request, and tcp-response rule sets.
 *
 * Source: HAProxy 3.1 configuration.txt section 4.3 (Actions keywords matrix)
 * and section 4.4 (Alphabetically sorted actions reference).
 *
 * Each entry documents which rule sets the action is valid in using
 * a compact flags object.
 */

/** Rule sets where an action may be used. */
export interface ActionRulesets {
  /** quic-initial rules */
  readonly quicIni?: true;
  /** tcp-request connection rules */
  readonly tcpRqCon?: true;
  /** tcp-request session rules */
  readonly tcpRqSes?: true;
  /** tcp-request content rules */
  readonly tcpRqCnt?: true;
  /** tcp-response content rules */
  readonly tcpRsCnt?: true;
  /** http-request rules */
  readonly httpReq?: true;
  /** http-response rules */
  readonly httpRes?: true;
  /** http-after-response rules */
  readonly httpAft?: true;
}

export interface ActionDef {
  readonly name: string;
  readonly signature: string;
  readonly description: string;
  readonly rulesets: ActionRulesets;
  readonly since: string;
  readonly deprecated?: string;
}

export const ACTIONS: ActionDef[] = [
  // ── Accept / Allow / Reject ───────────────────────────────────────────────

  {
    name: 'accept',
    signature: '',
    description: 'Stop rule evaluation and let the connection/request pass. Final action. Used in TCP/QUIC rules.',
    rulesets: { quicIni: true, tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true },
    since: '2.4',
  },
  {
    name: 'allow',
    signature: '',
    description: 'Stop rule evaluation and let the HTTP request/response pass. Final action. Used in HTTP rules.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'reject',
    signature: '',
    description: 'Reject the connection or request. Final action.',
    rulesets: { quicIni: true, tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true },
    since: '2.4',
  },
  {
    name: 'deny',
    signature: '[deny_status <status>] [hdr <name> <fmt>] [drop-query]',
    description: 'Deny the HTTP request with an optional status code. Final action.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'auth',
    signature: '[realm <realm>]',
    description: 'Reply with HTTP 401/407 to request basic authentication. Final action.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'tarpit',
    signature: '[deny_status <status>]',
    description: 'Defer the response to slow down abusers (tarpit). Final action.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'silent-drop',
    signature: '',
    description: 'Silently drop the connection without sending a response.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'dgram-drop',
    signature: '',
    description: 'Silently drop the QUIC datagram.',
    rulesets: { quicIni: true },
    since: '2.6',
  },

  // ── Header manipulation ───────────────────────────────────────────────────

  {
    name: 'add-header',
    signature: '<name> <fmt>',
    description: 'Append an HTTP header field (does not replace existing).',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'set-header',
    signature: '<name> <fmt>',
    description: 'Set or replace an HTTP header field.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'del-header',
    signature: '<name> [<method>]',
    description: 'Remove all occurrences of the given HTTP header.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'replace-header',
    signature: '<name> <match-regex> <replace-fmt>',
    description: 'Replace the value of an HTTP header matching a regex.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'replace-value',
    signature: '<name> <match-regex> <replace-fmt>',
    description: 'Replace one comma-separated value in a multi-value HTTP header.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'early-hint',
    signature: '<name> <fmt>',
    description: 'Add a Link header to a 103 Early Hints response.',
    rulesets: { httpReq: true },
    since: '2.4',
  },

  // ── URL / path manipulation ───────────────────────────────────────────────

  {
    name: 'set-uri',
    signature: '<fmt>',
    description: 'Replace the entire request URI.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-path',
    signature: '<fmt>',
    description: 'Replace the path component of the request URI.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-pathq',
    signature: '<fmt>',
    description: 'Replace the path and query string components of the request URI.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-query',
    signature: '<fmt>',
    description: 'Replace the query string component of the request URI.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'replace-path',
    signature: '<match-regex> <replace-fmt>',
    description: 'Replace the path component matching a regex.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'replace-pathq',
    signature: '<match-regex> <replace-fmt>',
    description: 'Replace the path+query matching a regex.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'replace-uri',
    signature: '<match-regex> <replace-fmt>',
    description: 'Replace the URI matching a regex.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'normalize-uri',
    signature: '<normalizer>',
    description: 'Apply a URI normalization algorithm (percent-decode, path-merge-slashes, etc.).',
    rulesets: { httpReq: true },
    since: '2.4',
  },

  // ── Method / status ───────────────────────────────────────────────────────

  {
    name: 'set-method',
    signature: '<fmt>',
    description: 'Replace the HTTP request method.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-status',
    signature: '<code> [reason <fmt>]',
    description: 'Replace the HTTP response status code and optional reason phrase.',
    rulesets: { httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── Redirect ──────────────────────────────────────────────────────────────

  {
    name: 'redirect',
    signature: 'location <loc>|prefix <pfx>|scheme <sch> [<options>]',
    description: 'Send an HTTP redirect response. Final action.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },

  // ── Return ────────────────────────────────────────────────────────────────

  {
    name: 'return',
    signature: '[status <code>] [content-type <ct>] [<body>]',
    description: 'Return a synthetic HTTP response with optional body. Final action.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.2',
  },

  // ── Variable manipulation ────────────────────────────────────────────────

  {
    name: 'set-var',
    signature: '(<varname>) <expr>',
    description: 'Set a HAProxy variable to the result of an expression.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'set-var-fmt',
    signature: '(<varname>) <fmt>',
    description: 'Set a HAProxy variable using a log-format string.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.6',
  },
  {
    name: 'unset-var',
    signature: '(<varname>)',
    description: 'Unset (delete) a HAProxy variable.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── Stick counters ────────────────────────────────────────────────────────

  {
    name: 'sc-add-gpc',
    signature: '<idx> <expr> [<cond>]',
    description: 'Add a value to a stick counter general-purpose counter.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.6',
  },
  {
    name: 'sc-inc-gpc',
    signature: '<idx>',
    description: 'Increment a stick counter general-purpose counter by 1.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.6',
  },
  {
    name: 'sc-inc-gpc0',
    signature: '<idx>',
    description: 'Increment stick counter GPC0 by 1 (legacy alias for sc-inc-gpc).',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'sc-inc-gpc1',
    signature: '<idx>',
    description: 'Increment stick counter GPC1 by 1.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'sc-set-gpt',
    signature: '<idx> <expr>',
    description: 'Set a stick counter general-purpose tag.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.6',
  },
  {
    name: 'sc-set-gpt0',
    signature: '<idx> <int>',
    description: 'Set stick counter GPT0 tag (legacy alias for sc-set-gpt).',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── Track / stick ─────────────────────────────────────────────────────────

  {
    name: 'track-sc1',
    signature: '<key> [table <table>] [<cond>]',
    description: 'Track a key in stick-counter slot 1.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'track-sc2',
    signature: '<key> [table <table>] [<cond>]',
    description: 'Track a key in stick-counter slot 2.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
  },

  // ── Logging ───────────────────────────────────────────────────────────────

  {
    name: 'do-log',
    signature: '',
    description: 'Force logging for this connection/request, even if log-format is off.',
    rulesets: { quicIni: true, tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'set-log-level',
    signature: '<level>',
    description: 'Override the log level for the current request (emerg..debug).',
    rulesets: { tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── ACL / map manipulation ────────────────────────────────────────────────

  {
    name: 'add-acl',
    signature: '(<file>) <key-fmt>',
    description: 'Add a new entry to an ACL file at runtime.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'del-acl',
    signature: '(<file>) <key-fmt>',
    description: 'Delete an entry from an ACL file at runtime.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'set-map',
    signature: '(<file>) <key-fmt> <value-fmt>',
    description: 'Add or update a map file entry at runtime.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },
  {
    name: 'del-map',
    signature: '(<file>) <key-fmt>',
    description: 'Delete a map file entry at runtime.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── Destination / source manipulation ────────────────────────────────────

  {
    name: 'set-dst',
    signature: '<expr>',
    description: 'Override the destination IP address for the connection.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-dst-port',
    signature: '<expr>',
    description: 'Override the destination port for the connection.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-src',
    signature: '<expr>',
    description: 'Override the source IP address seen by HAProxy.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-src-port',
    signature: '<expr>',
    description: 'Override the source port seen by HAProxy.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },

  // ── Connection mark / tos ─────────────────────────────────────────────────

  {
    name: 'set-fc-mark',
    signature: '<expr>',
    description: 'Set the Netfilter mark on the frontend connection.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.6',
  },
  {
    name: 'set-fc-tos',
    signature: '<expr>',
    description: 'Set the IP TOS/DSCP field on the frontend connection.',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.6',
  },
  {
    name: 'set-bc-mark',
    signature: '<expr>',
    description: 'Set the Netfilter mark on the backend connection.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.6',
  },
  {
    name: 'set-bc-tos',
    signature: '<expr>',
    description: 'Set the IP TOS/DSCP field on the backend connection.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.6',
  },
  {
    name: 'set-mark',
    signature: '<value>',
    description: 'Set the Netfilter mark on the connection (deprecated, use set-fc-mark).',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
    deprecated: '2.6',
  },
  {
    name: 'set-tos',
    signature: '<value>',
    description: 'Set the IP TOS/DSCP on the connection (deprecated, use set-fc-tos).',
    rulesets: { tcpRqCon: true, tcpRqSes: true, tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
    deprecated: '2.6',
  },

  // ── Priority / nice ───────────────────────────────────────────────────────

  {
    name: 'set-nice',
    signature: '<value>',
    description: 'Set the HAProxy task niceness (-1024 to 1024) for this connection.',
    rulesets: { tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'set-priority-class',
    signature: '<expr>',
    description: 'Set the priority class for this request when queuing.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },
  {
    name: 'set-priority-offset',
    signature: '<expr>',
    description: 'Set the priority offset within the class for this request.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },

  // ── Timeout / retry ───────────────────────────────────────────────────────

  {
    name: 'set-timeout',
    signature: '<event> <time>',
    description: 'Override a connection timeout value for the current request.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'set-retries',
    signature: '<expr>',
    description: 'Override the number of retries for the current request.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.6',
  },

  // ── Mode switch ───────────────────────────────────────────────────────────

  {
    name: 'switch-mode',
    signature: '<mode> [proto <proto>]',
    description: 'Switch the frontend from TCP to HTTP mode on the fly.',
    rulesets: { tcpRqCnt: true },
    since: '2.4',
  },
  {
    name: 'strict-mode',
    signature: '{ on | off }',
    description: 'Enable or disable HTTP strict mode (reject invalid headers) for this request.',
    rulesets: { httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── Body / inspect ────────────────────────────────────────────────────────

  {
    name: 'wait-for-body',
    signature: '[time <delay>] [at-least <nb>]',
    description: 'Wait for the full request/response body before continuing rule evaluation.',
    rulesets: { httpReq: true, httpRes: true },
    since: '2.4',
  },
  {
    name: 'wait-for-handshake',
    signature: '',
    description: 'Wait for the TLS handshake to complete before continuing rule evaluation.',
    rulesets: { httpReq: true },
    since: '2.4',
  },

  // ── Capture ───────────────────────────────────────────────────────────────

  {
    name: 'capture',
    signature: '<sample> len <len>|slot <id>',
    description: 'Capture a sample value and store it in the log capture buffer.',
    rulesets: { tcpRqCnt: true, httpReq: true, httpRes: true, httpAft: true },
    since: '2.4',
  },

  // ── DNS / resolve ─────────────────────────────────────────────────────────

  {
    name: 'do-resolve',
    signature: '(<varname>) <resolvers> [<protocol>] <name-fmt>',
    description: 'Resolve a hostname and store the IP result in a variable.',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },

  // ── Cache ─────────────────────────────────────────────────────────────────

  {
    name: 'cache-store',
    signature: '<name>',
    description: 'Store the HTTP response in the named cache.',
    rulesets: { httpRes: true },
    since: '2.4',
  },
  {
    name: 'cache-use',
    signature: '<name>',
    description: 'Deliver a cached response from the named cache if available.',
    rulesets: { httpReq: true },
    since: '2.4',
  },

  // ── SPOE ──────────────────────────────────────────────────────────────────

  {
    name: 'send-spoe-group',
    signature: '<engine> <group>',
    description: 'Send a SPOE message group to the SPOE agent.',
    rulesets: { tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.4',
  },

  // ── Bandwidth ─────────────────────────────────────────────────────────────

  {
    name: 'set-bandwidth-limit',
    signature: '<name> [limit <expr>] [window <time>]',
    description: 'Apply a bandwidth limit policy to the current stream.',
    rulesets: { tcpRqCnt: true, tcpRsCnt: true, httpReq: true, httpRes: true },
    since: '2.6',
  },

  // ── Service ───────────────────────────────────────────────────────────────

  {
    name: 'use-service',
    signature: '<svc-name>',
    description: 'Forward the request to an internal service (e.g. Lua service).',
    rulesets: { tcpRqCnt: true, httpReq: true },
    since: '2.4',
  },

  // ── Close ─────────────────────────────────────────────────────────────────

  {
    name: 'close',
    signature: '',
    description: 'Close the server connection after the response.',
    rulesets: { tcpRsCnt: true },
    since: '2.4',
  },

  // ── PROXY protocol ───────────────────────────────────────────────────────

  {
    name: 'expect-netscaler-cip',
    signature: '',
    description: 'Expect a NetScaler Client IP header on this connection.',
    rulesets: { tcpRqCon: true },
    since: '2.4',
  },
  {
    name: 'expect-proxy layer4',
    signature: '',
    description: 'Expect a PROXY protocol header on this connection.',
    rulesets: { tcpRqCon: true },
    since: '2.4',
  },

  // ── Misc ──────────────────────────────────────────────────────────────────

  {
    name: 'attach-srv',
    signature: '<srv> [name <expr>]',
    description: 'Intercept the connection and insert it into the server idle pool (reverse HTTP).',
    rulesets: { tcpRqSes: true },
    since: '2.6',
  },
  {
    name: 'disable-l7-retry',
    signature: '',
    description: 'Disable L7 retries for the current request.',
    rulesets: { httpReq: true },
    since: '2.4',
  },
  {
    name: 'send-retry',
    signature: '',
    description: 'Trigger a QUIC retry for the current initial packet.',
    rulesets: { quicIni: true },
    since: '2.8',
  },
];
