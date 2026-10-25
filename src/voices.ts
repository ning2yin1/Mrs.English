import reviewJson from "../data/voice-review.json" with { type: "json" };
import { assets, type Member } from "./data";
type VoiceReview = {
  voiceId: string;
  member: string;
  path: string;
  transcript: string | null;
  meaningClass: string;
  ranks: string[];
  photoCardIds: string[];
  reviewStatus: string;
};
export const voiceReviews = reviewJson as VoiceReview[];
export function resultCandidates(member: Member, rank: string) {
  return voiceReviews
    .filter(
      (v) =>
        v.member === member &&
        v.reviewStatus === "user-confirmed-transcript" &&
        v.ranks.includes(rank) &&
        v.transcript &&
        v.photoCardIds.length,
    )
    .flatMap((v) =>
      v.photoCardIds.map((photo) => ({
        voiceId: v.voiceId,
        photoCardId: photo,
      })),
    );
}
export function choosePresentation(
  member: Member,
  rank: string,
  lastVoice: string,
  lastPhoto: string,
  rng: () => number,
) {
  const all = resultCandidates(member, rank);
  if (!all.length) return null;
  const differentVoice = all.filter((v) => v.voiceId !== lastVoice);
  const differentPair = all.filter(
    (v) => v.voiceId !== lastVoice || v.photoCardId !== lastPhoto,
  );
  const pool = differentVoice.length
    ? differentVoice
    : differentPair.length
      ? differentPair
      : all;
  return pool[Math.floor(rng() * pool.length)];
}
export function verifiedResultVoice(member: Member, rank: string, id: string) {
  return resultCandidates(member, rank).some((v) => v.voiceId === id)
    ? assets.audio.find((v) => v.id === id)
    : undefined;
}
