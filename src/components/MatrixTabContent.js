import React from "react";

const MatrixTabContent = ({
  data,
  selectedOffer,
  setSelectedOffer,
  searchTerm,
  setSearchTerm,
  relevanceFilter,
  setRelevanceFilter,
  groupedByNews,
  offersWithNewsButNoOpp,
  offeringToServiceLine,
}) => {
  return (
    <>
      <div className="filters-row">
        <div className="form-group">
          <label className="form-label">Filtrer par offre BearingPoint:</label>
          <select
            className="form-control"
            value={selectedOffer}
            onChange={(e) => setSelectedOffer(e.target.value)}
          >
            <option value="all">Toutes les offres</option>
            {Object.keys(data.bpOffers).map((offer) => (
              <option key={offer} value={offer}>
                {offer}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Recherche:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher une actualité, catégorie ou offre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Score de pertinence minimum:</label>
          <select
            className="form-control"
            value={relevanceFilter}
            onChange={(e) => setRelevanceFilter(parseInt(e.target.value))}
          >
            <option value="0">Tous les scores</option>
            <option value="1">1 et plus</option>
            <option value="2">2 et plus</option>
            <option value="3">3 et plus</option>
          </select>
        </div>
      </div>

      <div className="info-box mb-4">
        <h3 className="text-center mb-2">Score de pertinence</h3>
        <div className="d-flex justify-between">
          <div className="d-flex align-center gap-2">
            <div className="rating rating-3">3</div>
            <div>Très pertinent</div>
          </div>
          <div className="d-flex align-center gap-2">
            <div className="rating rating-2">2</div>
            <div>Pertinent</div>
          </div>
          <div className="d-flex align-center gap-2">
            <div className="rating rating-1">1</div>
            <div>Légèrement pertinent</div>
          </div>
        </div>
      </div>

      {Object.values(groupedByNews).length > 0 ? (
        <div className="news-list">
          {Object.values(groupedByNews).map((group, index) => (
            <div key={index} className="card">
              <div className="card-header">
                <h2 className="card-title">{group.news}</h2>
                <div className="d-flex justify-between">
                  <div className="card-date">{group.newsDate}</div>
                  <span className="badge badge-info">{group.newsCategory}</span>
                </div>
              </div>

              <div>
                <h3>Offres BearingPoint pertinentes:</h3>
                <div className="list">
                  {group.offers.map((offer, offerIdx) => (
                    <div key={offerIdx} className="list-item">
                      <div>
                        <div className="list-item-heading">
                          {offer.category}
                        </div>
                        <div className="list-item-text">{offer.detail}</div>
                        {!offer.hasOpportunities && (
                          <div className="mt-2">
                            <span className="badge badge-warning">
                              ⚠️ Pas d'opportunité en cours
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="d-flex align-center">
                        <span
                          className={`rating ${
                            offer.relevanceScore === 3
                              ? "rating-3"
                              : offer.relevanceScore === 2
                              ? "rating-2"
                              : "rating-1"
                          }`}
                        >
                          {offer.relevanceScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-text">
            Aucun résultat trouvé pour les critères sélectionnés.
          </div>
        </div>
      )}

      {/* Liste des offres sans opportunités mais mentionnées dans les actualités */}
      {offersWithNewsButNoOpp.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-3">
            Offres mentionnées dans les actualités sans opportunités actives
          </h2>
          <div className="warning-box">
            <ul className="pl-4">
              {offersWithNewsButNoOpp.map((offer, idx) => (
                <li key={idx} className="mb-2">
                  <strong>{offer}</strong>
                  <span className="text-muted ml-2">
                    ({offeringToServiceLine[offer]})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default MatrixTabContent;
