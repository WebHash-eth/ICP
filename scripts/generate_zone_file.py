import argparse


def generate_zone_file(domain: str, canister_id: str, output_file: str):
    zone_content = f"""$ORIGIN {domain}.
$TTL 600

; Route all traffic for {domain} to the HTTP gateway
@                   IN CNAME {domain}.icp1.io.

; Associate the canister ID with the _canister-id subdomain
_canister-id        IN TXT "{canister_id}"

; Route the _acme-challenge subdomain to the certificate acquisition gateway
_acme-challenge     IN CNAME _acme-challenge.{domain}.icp2.io.
"""
    with open(output_file, "w") as f:
        f.write(zone_content)
    print(f"Zone file written to {output_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Automatically generate a DNS zone file for Cloudflare."
    )
    parser.add_argument(
        "--domain",
        required=True,
        help="Your custom domain (e.g., hash.aman.run)",
    )
    parser.add_argument(
        "--canister",
        required=True,
        help="The canister ID (e.g., 7xbei-4yaaa-aaaad-qg6dq-cai)",
    )
    parser.add_argument(
        "--output",
        default="zonefile.zone",
        help="Output file name (default: zonefile.zone)",
    )
    args = parser.parse_args()
    generate_zone_file(args.domain, args.canister, args.output)
