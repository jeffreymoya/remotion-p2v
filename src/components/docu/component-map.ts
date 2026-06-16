import type React from "react";
import {
  TitleCard,
  LowerThirdChyron,
  KineticNumber,
  RedactedReveal,
  MarkerHighlight,
  TypewriterMemo,
  PullQuote,
  BreakingNews,
  SourceAttribution,
  EvidenceStamp,
  HighlightedPhrase,
  PowerWord,
  KeyTermCallout,
  ContrastStrike,
  SplitCard,
  ArticleCard,
  ContextBar,
  DocumentaryCaption,
  Chart,
} from "./index";

export type DocuComponent = React.ComponentType<Record<string, unknown>>;

export const COMPONENT_MAP: Record<string, DocuComponent> = {
  TitleCard: TitleCard as unknown as DocuComponent,
  LowerThirdChyron: LowerThirdChyron as unknown as DocuComponent,
  KineticNumber: KineticNumber as unknown as DocuComponent,
  RedactedReveal: RedactedReveal as unknown as DocuComponent,
  MarkerHighlight: MarkerHighlight as unknown as DocuComponent,
  TypewriterMemo: TypewriterMemo as unknown as DocuComponent,
  PullQuote: PullQuote as unknown as DocuComponent,
  BreakingNews: BreakingNews as unknown as DocuComponent,
  SourceAttribution: SourceAttribution as unknown as DocuComponent,
  EvidenceStamp: EvidenceStamp as unknown as DocuComponent,
  HighlightedPhrase: HighlightedPhrase as unknown as DocuComponent,
  PowerWord: PowerWord as unknown as DocuComponent,
  KeyTermCallout: KeyTermCallout as unknown as DocuComponent,
  ContrastStrike: ContrastStrike as unknown as DocuComponent,
  SplitCard: SplitCard as unknown as DocuComponent,
  ArticleCard: ArticleCard as unknown as DocuComponent,
  ContextBar: ContextBar as unknown as DocuComponent,
  DocumentaryCaption: DocumentaryCaption as unknown as DocuComponent,
  Chart: Chart as unknown as DocuComponent,
};

export function getComponent(name: string): DocuComponent | undefined {
  return COMPONENT_MAP[name];
}
