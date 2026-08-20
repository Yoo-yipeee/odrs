# ODRS and existing standards

The first question any reviewer should ask of a new specification is "why
does this exist when X exists?" This document answers it standard by
standard. Short version: everything below standardizes **datasets that
exist**. ODRS standardizes **the request for data that does not exist yet**.
The two meet at `delivery.format`.

## LeRobot (LeRobotDataset)

The de facto dataset format for PyTorch robot learning: Parquet + video,
hosted and streamed via the Hugging Face Hub. Describes episodes that have
been collected — observations, actions, timestamps, features.

**Division of labour:** an ODRS request says *"collect 40,000 episodes
meeting these criteria and deliver them as LeRobotDataset v2.1"*
(`delivery.format: {standard: lerobot, version: "2.1"}`). LeRobot then
governs the artifact; ODRS governed the agreement that produced it.
ODRS deliberately reuses LeRobot-adjacent vocabulary (episode, frame) with
written definitions so quantities in requests map cleanly onto quantities in
deliveries.

## RLDS / Open X-Embodiment

RLDS is the episode-storage format around TFDS; OXE is a federation of 60+
datasets in a shared schema. Same relationship as LeRobot: delivery-side.
`delivery.format: {standard: rlds}`.

## MCAP / rosbag2

Container formats for timestamped multi-stream robot logs. Delivery-side;
named in `delivery.format`. ODRS's `capture.synchronization` and
`acceptance.criteria` express what must be true *of* those logs.

## ISO/WD 26264 (humanoid robot datasets, ISO/TC 299 WG 16)

In development as of 2026. Specifies general requirements for humanoid robot
*datasets* — lifecycle, metadata, provenance, quality, versioning. It answers
"what must a delivered dataset contain to be trustworthy?" ODRS answers "how
does a buyer state what they want collected?" These are adjacent, not
overlapping: an ODRS request can require ISO 26264 conformance of its
delivery once the standard is published (via `delivery.format.notes` today; a
structured field is a candidate once 26264 stabilizes). ODRS's stewards
should track WG 16 and align terminology where the drafts touch.

## Croissant (MLCommons)

Machine-readable *metadata* for ML datasets, built on schema.org — discovery
and loading of existing datasets. No demand-side or physical-AI-specific
vocabulary. Complementary; and MLCommons' Data working group is the primary
target for ODRS stewardship transfer precisely because Croissant proves they
do this kind of vocabulary work well.

## RFQ / procurement standards (generic)

Generic e-procurement formats (UBL RFQ etc.) can carry "a buyer wants
something" but have no vocabulary for embodiment, modality, action space,
sync tolerance, episode, or collection-vs-usage geography — the parts that
make a Physical AI data requirement precise. ODRS is that missing domain
vocabulary in a shape procurement systems can consume (plain JSON).

## The gap ODRS fills, stated once

| | Supply side (exists) | Demand side |
|---|---|---|
| Format | LeRobot, RLDS, MCAP, rosbag2 | — |
| Dataset requirements | ISO/WD 26264 | — |
| Metadata / discovery | Croissant | — |
| **Requirement expression** | — | **ODRS** |

If a body above extends into request expression, the correct move for ODRS is
alignment or donation, not competition — that commitment is written into
GOVERNANCE.md.
