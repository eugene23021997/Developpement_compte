/**
 * Service pour gérer les opportunités de prospection identifiées
 * Ce service centralise la gestion des opportunités sélectionnées
 * et permet leur synchronisation entre les différents onglets
 */

// Événements personnalisés pour la communication entre composants
const OPPORTUNITY_SELECTED_EVENT = 'opportunity-selected';
const OPPORTUNITY_DESELECTED_EVENT = 'opportunity-deselected';

/**
 * Service de gestion des opportunités de prospection
 */
class ProspectionService {
  constructor() {
    // Stockage des opportunités sélectionnées
    this.selectedOpportunities = [];
    
    // Abonnés aux événements
    this.subscribers = {
      onChange: []
    };
    
    // Initialiser les écouteurs d'événements
    this._initEventListeners();
  }
  
  /**
   * Initialise les écouteurs d'événements personnalisés
   * @private
   */
  _initEventListeners() {
    // Écouter les événements de sélection d'opportunité
    window.addEventListener(OPPORTUNITY_SELECTED_EVENT, (event) => {
      const { opportunity } = event.detail;
      this.selectOpportunity(opportunity, false); // Ne pas déclencher d'événement pour éviter les boucles
    });
    
    // Écouter les événements de désélection d'opportunité
    window.addEventListener(OPPORTUNITY_DESELECTED_EVENT, (event) => {
      const { opportunity } = event.detail;
      this.deselectOpportunity(opportunity, false); // Ne pas déclencher d'événement pour éviter les boucles
    });
  }
  
  /**
   * Sélectionne une opportunité de prospection
   * @param {Object} opportunity - L'opportunité à sélectionner
   * @param {boolean} emitEvent - Si un événement doit être émis (défaut: true)
   */
  selectOpportunity(opportunity, emitEvent = true) {
    // Vérifier si l'opportunité est déjà sélectionnée
    const isAlreadySelected = this.selectedOpportunities.some(
      op => op.category === opportunity.category && op.detail === opportunity.detail
    );
    
    // Si elle n'est pas déjà sélectionnée, l'ajouter
    if (!isAlreadySelected) {
      this.selectedOpportunities.push(opportunity);
      
      // Notifier les abonnés du changement
      this._notifySubscribers();
      
      // Émettre un événement pour notifier les autres composants
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent(OPPORTUNITY_SELECTED_EVENT, {
          detail: { opportunity }
        }));
      }
    }
  }
  
  /**
   * Désélectionne une opportunité de prospection
   * @param {Object} opportunity - L'opportunité à désélectionner
   * @param {boolean} emitEvent - Si un événement doit être émis (défaut: true)
   */
  deselectOpportunity(opportunity, emitEvent = true) {
    // Filtrer l'opportunité de la liste
    this.selectedOpportunities = this.selectedOpportunities.filter(
      op => !(op.category === opportunity.category && op.detail === opportunity.detail)
    );
    
    // Notifier les abonnés du changement
    this._notifySubscribers();
    
    // Émettre un événement pour notifier les autres composants
    if (emitEvent) {
      window.dispatchEvent(new CustomEvent(OPPORTUNITY_DESELECTED_EVENT, {
        detail: { opportunity }
      }));
    }
  }
  
  /**
   * Bascule l'état de sélection d'une opportunité
   * @param {Object} opportunity - L'opportunité à basculer
   */
  toggleOpportunity(opportunity) {
    const isSelected = this.isOpportunitySelected(opportunity);
    
    if (isSelected) {
      this.deselectOpportunity(opportunity);
    } else {
      this.selectOpportunity(opportunity);
    }
  }
  
  /**
   * Vérifie si une opportunité est sélectionnée
   * @param {Object} opportunity - L'opportunité à vérifier
   * @returns {boolean} Vrai si l'opportunité est sélectionnée
   */
  isOpportunitySelected(opportunity) {
    return this.selectedOpportunities.some(
      op => op.category === opportunity.category && op.detail === opportunity.detail
    );
  }
  
  /**
   * Récupère toutes les opportunités sélectionnées
   * @returns {Array} Les opportunités sélectionnées
   */
  getSelectedOpportunities() {
    return [...this.selectedOpportunities];
  }
  
  /**
   * Efface toutes les opportunités sélectionnées
   */
  clearSelectedOpportunities() {
    this.selectedOpportunities = [];
    this._notifySubscribers();
  }
  
  /**
   * S'abonne aux changements des opportunités sélectionnées
   * @param {Function} callback - Fonction de rappel à appeler lors des changements
   * @returns {Function} Fonction pour se désabonner
   */
  subscribe(callback) {
    this.subscribers.onChange.push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.subscribers.onChange = this.subscribers.onChange.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifie tous les abonnés d'un changement
   * @private
   */
  _notifySubscribers() {
    this.subscribers.onChange.forEach(callback => {
      callback(this.selectedOpportunities);
    });
  }
  
  /**
   * Identifie les opportunités potentielles à partir de la matrice de pertinence
   * @param {Array} relevanceMatrix - Matrice de pertinence des actualités
   * @returns {Array} Opportunités potentielles de prospection
   */
  identifyPotentialOpportunities(relevanceMatrix) {
    if (!relevanceMatrix || !Array.isArray(relevanceMatrix)) {
      return [];
    }
    
    // Filtrer les entrées de matrice avec un score de pertinence élevé (3)
    const highRelevanceItems = relevanceMatrix.filter(item => item.relevanceScore === 3);
    
    // Convertir en format standard d'opportunité
    return highRelevanceItems.map(item => ({
      category: item.offerCategory,
      detail: item.offerDetail,
      news: item.news,
      newsDate: item.newsDate,
      newsDescription: item.newsDescription,
      newsLink: item.newsLink,
      relevanceScore: item.relevanceScore
    }));
  }
  
  /**
   * Identifie les opportunités potentielles sans projets existants
   * @param {Array} relevanceMatrix - Matrice de pertinence des actualités
   * @param {Object} opportunitiesByOffering - Opportunités existantes par offre
   * @returns {Array} Opportunités potentielles sans projets existants
   */
  identifyNewOpportunities(relevanceMatrix, opportunitiesByOffering) {
    const allPotential = this.identifyPotentialOpportunities(relevanceMatrix);
    
    // Filtrer les opportunités qui n'ont pas de projets existants
    return allPotential.filter(opportunity => {
      const offerDetails = opportunity.detail.split(", ");
      
      // Vérifier si tous les éléments de l'offre n'ont pas d'opportunités existantes
      return offerDetails.every(detail => {
        // Trouver l'offre correspondante
        const matchingOffering = Object.keys(opportunitiesByOffering).find(
          offering => offering.includes(detail) || detail.includes(offering)
        );
        
        // Si aucune offre correspondante n'est trouvée, c'est une nouvelle opportunité
        if (!matchingOffering) return true;
        
        // Si l'offre correspondante n'a pas d'opportunités, c'est une nouvelle opportunité
        return !opportunitiesByOffering[matchingOffering] || 
               opportunitiesByOffering[matchingOffering].length === 0;
      });
    });
  }
}

// Exporter une instance singleton du service
export const prospectionService = new ProspectionService();
