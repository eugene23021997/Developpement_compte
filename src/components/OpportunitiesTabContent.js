import React, { useState } from "react";
import { ChevronIcon } from "./Icons";

const OpportunitiesTabContent = ({
  data,
  selectedOffer,
  setSelectedOffer,
  yearFilter,
  setYearFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  serviceLineStats,
  offeringStats,
  yearlyStats,
  opportunitiesByOffering,
  offeringToServiceLine,
  extractYear,
  filteredOpportunities,
  sortOpportunities,
}) => {
  const [expandedServiceLine, setExpandedServiceLine] = useState(null);
  const [expandedOffer, setExpandedOffer] = useState(null);

  return (
    <div>
      <div className="filters-row">
        <div className="form-group">
          <label className="form-label">
            Filtrer par ligne de service ou offre:
          </label>
          <select
            className="form-control"
            value={selectedOffer}
            onChange={(e) => setSelectedOffer(e.target.value)}
          >
            <option value="all">Toutes les offres</option>
            {Object.keys(serviceLineStats).map((serviceLine) => (
              <option key={serviceLine} value={serviceLine}>
                {serviceLine}
              </option>
            ))}
            {Object.keys(offeringStats)
              .filter(
                (offering) => offeringStats[offering].totalOpportunities > 0
              )
              .sort()
              .map((offering) => (
                <option key={offering} value={offering}>
                  -- {offering}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Filtrer par année:</label>
          <select
            className="form-control"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">Toutes les années</option>
            {Object.keys(yearlyStats)
              .sort()
              .reverse()
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Trier par:</label>
          <div className="sort-control-wrapper">
            <select
              className="form-control sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="value">Valeur</option>
              <option value="name">Nom</option>
              <option value="cm1">CM1%</option>
            </select>
            <button
              className="sort-button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Croissant" : "Décroissant"}
              <ChevronIcon
                className={`chevron-icon ${sortOrder === "asc" ? "" : "down"}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="mb-3">Statistiques des opportunités</h2>
        <div className="stats-row mb-4">
          {Object.keys(yearlyStats)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .slice(0, 5)
            .map((year) => (
              <div
                key={year}
                className={`stat-card ${yearFilter === year ? "active" : ""}`}
                onClick={() => setYearFilter(year)}
              >
                <div className="stat-year">{year}</div>
                <div className="stat-value">
                  Opportunités: {yearlyStats[year].totalOpportunities}
                </div>
                <div className="stat-value">
                  Gagnées: {yearlyStats[year].bookedOpportunities}
                </div>
                <div className="stat-value">
                  Valeur: {yearlyStats[year].totalValue.toLocaleString()} €
                </div>
                <div className="stat-value">
                  Taux:{" "}
                  {(
                    (yearlyStats[year].bookedOpportunities /
                      yearlyStats[year].totalOpportunities) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            ))}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ligne de service / Offre</th>
                <th>Total Opps</th>
                <th>Gagnées</th>
                <th>Perdues</th>
                <th>Taux de succès</th>
                <th>Valeur Estimée</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(serviceLineStats)
                .filter(
                  ([serviceLine, _]) =>
                    selectedOffer === "all" ||
                    serviceLine === selectedOffer ||
                    (Object.keys(offeringStats).includes(selectedOffer) &&
                      offeringToServiceLine[selectedOffer] === serviceLine)
                )
                .map(([serviceLine, stats]) => (
                  <React.Fragment key={serviceLine}>
                    {/* Ligne de service */}
                    <tr
                      className="toggle-row"
                      onClick={() =>
                        setExpandedServiceLine(
                          expandedServiceLine === serviceLine
                            ? null
                            : serviceLine
                        )
                      }
                    >
                      <td className="d-flex align-center">
                        <span
                          className={`toggle-icon ${
                            expandedServiceLine === serviceLine
                              ? "expanded"
                              : ""
                          }`}
                        >
                          ▶
                        </span>
                        <strong>{serviceLine}</strong>
                      </td>
                      <td>{stats.totalOpportunities}</td>
                      <td>{stats.bookedOpportunities}</td>
                      <td>{stats.lostOpportunities}</td>
                      <td>
                        {stats.totalOpportunities > 0
                          ? (
                              (stats.bookedOpportunities /
                                stats.totalOpportunities) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                      <td>{stats.totalEstimatedValue.toLocaleString()} €</td>
                    </tr>

                    {/* Offres par ligne de service avec leurs opportunités */}
                    {expandedServiceLine === serviceLine && (
                      <>
                        {stats.offerings
                          .filter((offering) => {
                            if (
                              Object.keys(offeringStats).includes(
                                selectedOffer
                              ) &&
                              offeringToServiceLine[selectedOffer] ===
                                serviceLine
                            ) {
                              return offering === selectedOffer;
                            }
                            return true;
                          })
                          .sort()
                          .map((offering) => {
                            const offerStats = offeringStats[offering] || {
                              totalOpportunities: 0,
                              bookedOpportunities: 0,
                              lostOpportunities: 0,
                              winRate: "0.0",
                              totalEstimatedValue: 0,
                              totalBookedValue: 0,
                            };

                            // Vérifier si cette offre apparaît dans les actualités
                            const isInNews = data.relevanceMatrix.some((item) =>
                              item.offerDetail
                                .split(", ")
                                .some(
                                  (detail) =>
                                    detail === offering ||
                                    detail.includes(offering) ||
                                    offering.includes(detail)
                                )
                            );

                            const rowClass =
                              isInNews && offerStats.totalOpportunities === 0
                                ? "bg-warning"
                                : offerStats.totalOpportunities === 0
                                ? "text-muted"
                                : "cursor-pointer";

                            return (
                              <React.Fragment key={offering}>
                                <tr
                                  className={rowClass}
                                  onClick={() =>
                                    offerStats.totalOpportunities > 0
                                      ? setExpandedOffer(
                                          expandedOffer === offering
                                            ? null
                                            : offering
                                        )
                                      : null
                                  }
                                >
                                  <td className="pl-4 d-flex align-center">
                                    {offerStats.totalOpportunities > 0 && (
                                      <span
                                        className={`toggle-icon ${
                                          expandedOffer === offering
                                            ? "expanded"
                                            : ""
                                        }`}
                                      >
                                        ▶
                                      </span>
                                    )}
                                    {offering}
                                    {isInNews &&
                                      offerStats.totalOpportunities === 0 && (
                                        <span className="badge badge-warning ml-2">
                                          ⚠️ Actualité sans opportunité
                                        </span>
                                      )}
                                  </td>
                                  <td>{offerStats.totalOpportunities || 0}</td>
                                  <td>{offerStats.bookedOpportunities || 0}</td>
                                  <td>{offerStats.lostOpportunities || 0}</td>
                                  <td>{offerStats.winRate || "0.0"}%</td>
                                  <td>
                                    {(
                                      offerStats.totalEstimatedValue || 0
                                    ).toLocaleString()}{" "}
                                    €
                                  </td>
                                </tr>

                                {/* Détail des opportunités directement sous chaque offre */}
                                {expandedOffer === offering &&
                                  offerStats.totalOpportunities > 0 && (
                                    <tr>
                                      <td colSpan="6" className="p-0">
                                        <div className="p-4 mx-4 mb-4">
                                          <div className="d-flex justify-between align-center mb-3">
                                            <h3 className="mb-0 text-blue-600">
                                              Détail des opportunités
                                            </h3>
                                            <span className="text-muted">
                                              {yearFilter === "all"
                                                ? "Toutes années"
                                                : `Année ${yearFilter}`}
                                            </span>
                                          </div>
                                          <div className="opportunity-list">
                                            {sortOpportunities(
                                              filteredOpportunities(
                                                opportunitiesByOffering[
                                                  offering
                                                ]
                                              )
                                            ).map((opp) => (
                                              <div
                                                key={opp.id}
                                                className={`opportunity-card ${
                                                  opp.status.includes("Booked")
                                                    ? "won"
                                                    : "lost"
                                                }`}
                                              >
                                                <div className="opportunity-header">
                                                  <div className="opportunity-title">
                                                    {opp.name}
                                                  </div>
                                                  <span
                                                    className={`badge ${
                                                      opp.status.includes(
                                                        "Booked"
                                                      )
                                                        ? "badge-success"
                                                        : "badge-danger"
                                                    }`}
                                                  >
                                                    {opp.status.includes(
                                                      "Booked"
                                                    )
                                                      ? "Gagné"
                                                      : "Perdu"}
                                                  </span>
                                                </div>
                                                <div className="opportunity-grid">
                                                  <div>
                                                    <div className="opportunity-label">
                                                      ID
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.id}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      Date de clôture
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.closeDate}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      Valeur estimée
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.estimatedValue.toLocaleString()}{" "}
                                                      €
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      Manager
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.accountManager ||
                                                        "-"}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      CM1%
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.cm1 || "-"}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      Revenu brut
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.grossRevenue.toLocaleString()}{" "}
                                                      €
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="opportunity-label">
                                                      Ligne de service
                                                    </div>
                                                    <div className="opportunity-value">
                                                      {opp.serviceLine}
                                                    </div>
                                                  </div>
                                                  {opp.comment && (
                                                    <div className="col-span-2">
                                                      <div className="opportunity-label">
                                                        Commentaire
                                                      </div>
                                                      <div className="opportunity-value">
                                                        {opp.comment}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                              </React.Fragment>
                            );
                          })}
                      </>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesTabContent;
