export type MetatagParser <Identifier, Content> = (tagMatch: MetatagRegexMatch, matchIndex: number, matchArray: MetatagRegexMatch[]) => ([Identifier, Content] | null);

export type MetatagRegexMatch = {
  content: string;
  start: number;
  end: number;
  length: number;
}

export type MetatagValue<T> = (T & { tagMatch: MetatagRegexMatch }) | null;

export const rawMatchToMetatagMatch = (match: RegExpMatchArray): MetatagRegexMatch | null => {
  const [content, start, length] = [match[1], match.index, match[0]?.length];
  if (!content || !start || !length) return null;
  const end = start + length;
  return { content, start, end, length };
}

export const metatagExtract = <I = string, C = Record<string, any>>
  (content: string, metatagParser: MetatagParser<I, C>): [I, C][] => {
    return [...content.matchAll(/{{((?:.)+)}}/g)]
      .map(rawMatchToMetatagMatch)
      .filter((match): match is MetatagRegexMatch => !!match)
      .map(metatagParser)
      .filter((tag): tag is [I, C] => !!tag);
  };

export type LayoutMetatagParser = MetatagParser<'layout' | 'slot', MetatagValue<{ path?: string }>>;
export const layoutMetatags: LayoutMetatagParser = (tagMatch) => {
  const { content } = tagMatch;

  if (content === 'slot') {
    return ['slot', { tagMatch }];
  }

  const firstLayoutMatch = [...content.matchAll(/\[([\w\s\d]+)\]\(((?:\.\/|\.\.\/)[\w.\d/]+)\.md\)/g)][0];
  if (firstLayoutMatch && firstLayoutMatch[1] === 'layout' && firstLayoutMatch[2]) {
    return ['layout', {
      tagMatch,
      path: `${firstLayoutMatch[2]}.md`,
    }];
  }

  return null;
}

export type IncludeMetatagParser = MetatagParser<'include', MetatagValue<{ path: string }>>;
export const includeMetatags: IncludeMetatagParser = (tagMatch) => {
  const { content } = tagMatch;
  const firstLayoutMatch = [...content.matchAll(/\[([\w\s\d]+)\]\(((?:\.\/|\.\.\/)[\w.\d/]+)\.md\)/g)][0]
  if (firstLayoutMatch && firstLayoutMatch[1] === 'include' && firstLayoutMatch[2]) {
    return ['include', {
      tagMatch,
      path: `${firstLayoutMatch[2]}.md`,
    }];
  }
  return null;
}
