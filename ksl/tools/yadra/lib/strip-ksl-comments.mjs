// Retire commentaires KSL (ligne et bloc) avant heuristiques layout.
export function stripKslComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

export function moduleHasSpecsBlock(text) {
  return /specs\s*=\s*\[/m.test(stripKslComments(text));
}
