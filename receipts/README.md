# Receipts

Copies of every document the story links to, recorded so anyone can check
that a file is the one the government site served on a given date.

## What's here

- `manifest.json`: For each linked URL, when it was fetched, the HTTP status,
  size, `Last-Modified` and `ETag` headers, and SHA-256 hash.
- `headers/`: The full response headers the server sent with each file.
- `SHA256SUMS`: The hash of each file, one per line.
- `SHA256SUMS.ots`: An [OpenTimestamps](https://opentimestamps.org) proof that
  `SHA256SUMS` existed at the time it was stamped, anchored in the Bitcoin
  blockchain.
- `ca/`: The GlobalSign intermediate certificate that `ceo.karnataka.gov.in`
  doesn't send. Without it, Node can't verify that site's TLS certificate.

The files themselves are in `files/`, which is not in this repository. The
roll PDFs carry the names, ages and voter IDs of thousands of people. Ask us
for a copy, or download the file from its URL and compare hashes.

## Check a file

From this folder, with the files in `files/`:

```bash
shasum -a 256 -c SHA256SUMS
```

To check the timestamp, use the OpenTimestamps client:

```bash
uvx --from opentimestamps-client ots verify SHA256SUMS.ots
```

## Archive new links

`pnpm receipts` finds every PDF, CSV, spreadsheet and ZIP linked from
`src/lib/content.md` and `src/lib/sources.js`. It saves any file that hasn't
been captured yet and rewrites `manifest.json` and `SHA256SUMS`. Use
`--refresh` to capture every URL again. A new capture is added to the
manifest, and if the file's hash changed it's marked `changed_since_previous`.

After a new capture, stamp the hash list again:

```bash
uvx --from opentimestamps-client ots stamp SHA256SUMS
```

A fresh proof is pending until a Bitcoin block confirms it, usually within a
few hours. Then run `ots upgrade SHA256SUMS.ots` and commit the result.
