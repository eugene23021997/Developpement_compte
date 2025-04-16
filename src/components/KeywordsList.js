// Version allégée du composant KeywordsList
const KeywordsList = ({ keywords }) => {
  // Si aucun mot-clé n'est fourni ou si c'est une chaîne vide
  if (!keywords || keywords.length === 0) {
    return null;
  }

  // Si c'est une chaîne, la diviser en tableau et limiter à max 4 mots-clés
  const keywordsArray =
    typeof keywords === "string"
      ? keywords
          .split(",")
          .map((k) => k.trim())
          .slice(0, 4)
      : keywords.slice(0, 4);

  // Si plus de 4 mots-clés, indiquer avec un +
  const hasMoreKeywords =
    typeof keywords === "string"
      ? keywords.split(",").length > 4
      : keywords.length > 4;

  return (
    <div className="premium-keywords-minimal">
      {keywordsArray.map((keyword, index) => (
        <span key={index} className="premium-keyword-minimal">
          {keyword}
        </span>
      ))}
      {hasMoreKeywords && <span className="premium-keyword-more">...</span>}
    </div>
  );
};
