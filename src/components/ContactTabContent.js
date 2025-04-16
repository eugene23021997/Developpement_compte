import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { contactExtractionService } from "../services/contactExtractionService";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant de gestion des contacts pour l'onglet Contacts
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.combinedRelevanceMatrix - Matrice combinée de pertinence des actualités
 * @param {Object} props.data - Données de l'application
 * @param {boolean} props.isLoadingRss - Indicateur de chargement des flux RSS
 */
const ContactTabContent = ({ combinedRelevanceMatrix, data, isLoadingRss }) => {
  // États de gestion des contacts
  const [contacts, setContacts] = useState([]);
  const [excelContacts, setExcelContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [missingRoles, setMissingRoles] = useState([]);
  const [missingRoleContacts, setMissingRoleContacts] = useState([]);
  const [fileImported, setFileImported] = useState(false);
  const [showMissingRoles, setShowMissingRoles] = useState(false);

  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);

  // Fonction pour traiter les données de contacts importées
  const processImportedData = useCallback((data) => {
    try {
      if (!data || data.length === 0) {
        alert("Le fichier importé ne contient pas de données.");
        return;
      }

      const firstRow = data[0];
      const availableHeaders = Object.keys(firstRow);

      // Créer des correspondances pour les champs importants
      const headerMap = {
        role: availableHeaders.find((h) => 
          /fonction|function|title|poste|role|job/i.test(h)
        ),
        department: availableHeaders.find((h) => 
          /département|department|dept|direction/i.test(h)
        ),
        email: availableHeaders.find((h) => 
          /email|mail|courriel|e-mail/i.test(h)
        ),
        phone: availableHeaders.find((h) => 
          /téléphone|telephone|phone|mobile|tél/i.test(h)
        ),
        business: availableHeaders.find((h) => 
          /business|bu|business unit|unité/i.test(h)
        ),
        company: availableHeaders.find((h) => 
          /entreprise|company|société|organization|organisation/i.test(h)
        ),
        industry: availableHeaders.find((h) => 
          /industry|industrie|secteur|sector/i.test(h)
        ),
      };

      // Normaliser les données
      const normalizedContacts = data
        .map((row) => {
          const getField = (key) => {
            const headerKey = headerMap[key];
            return headerKey && row[headerKey] ? row[headerKey] : "";
          };

          return {
            role: getField("role") || "Poste non spécifié",
            company: getField("company") || "Schneider Electric",
            confidenceScore: 1.0,
            sources: [],
            importedFromExcel: true,
            department: getField("department"),
            phone: getField("phone"),
            email: getField("email"),
            business: getField("business"),
            industry: getField("industry"),
          };
        })
        .filter(
          (contact) =>
            contact.role !== "Poste non spécifié" ||
            contact.email ||
            contact.department ||
            contact.business
        );

      setExcelContacts(normalizedContacts);
      setFileImported(true);

      // Identifier les rôles manquants qui pourraient être comblés
      matchMissingRolesWithImportedContacts(normalizedContacts);

      alert(
        `${normalizedContacts.length} contacts ont été importés avec succès!`
      );
    } catch (error) {
      console.error("Erreur lors du traitement des données importées:", error);
      alert(`Erreur lors du traitement des données: ${error.message}`);
    }
  }, [matchMissingRolesWithImportedContacts]);

  // Faire correspondre les rôles manquants avec les contacts importés
  const matchMissingRolesWithImportedContacts = useCallback((importedContacts) => {
    const matchedContacts = [];

    missingRoles.forEach((role) => {
      const matchingContacts = importedContacts.filter((contact) => {
        const roleText = role.toLowerCase();
        const contactRole = (contact.role || "").toLowerCase();
        return contactRole.includes(roleText) || roleText.includes(contactRole);
      });

      if (matchingContacts.length > 0) {
        matchingContacts.forEach((contact) => {
          matchedContacts.push({
            ...contact,
            relevantRole: role,
          });
        });
      }
    });

    setMissingRoleContacts(matchedContacts);
  }, [missingRoles]);

  // Importer des contacts depuis un fichier Excel ou CSV
  const importExcelContacts = useCallback(async (file) => {
    setImportLoading(true);
    try {
      // Détecter l'extension du fichier
      const fileExtension = file.split(".").pop().toLowerCase();
      console.log(`Type de fichier détecté: ${fileExtension}`);

      const fileContent = await window.fs.readFile(file, {
        encoding: "utf8",
      });

      if (fileExtension === "csv") {
        // Utiliser Papa Parse pour les fichiers CSV
        const Papa = await import("papaparse");
        const parseResult = Papa.default.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
          console.error("Erreurs lors du parsing CSV:", parseResult.errors);
          alert(`Erreur lors du parsing CSV: ${parseResult.errors[0].message}`);
          return;
        }

        processImportedData(parseResult.data);
      } else if (["xlsx", "xls"].includes(fileExtension)) {
        // Pour les fichiers Excel
        const XLSX = await import("xlsx");
        const buf = new ArrayBuffer(fileContent.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < fileContent.length; i++) {
          view[i] = fileContent.charCodeAt(i) & 0xff;
        }

        const workbook = XLSX.read(buf, {
          type: "array",
          cellDates: true,
        });

        const sheetName = workbook.SheetNames.includes("CRM_Contacts")
          ? "CRM_Contacts"
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        processImportedData(jsonData);
      } else {
        alert(
          `Format de fichier non supporté: ${fileExtension}. Veuillez utiliser un fichier Excel (.xlsx, .xls) ou CSV (.csv)`
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'importation des contacts:", error);
      alert(
        `Une erreur s'est produite lors de l'importation des contacts: ${error.message}`
      );
    } finally {
      setImportLoading(false);
    }
  }, [processImportedData]);

  // Le reste du code reste identique à l'implémentation précédente

  // ... (continuez avec le reste du code du composant)

  return ();
    // Votre code de rendu existant
  );
};

export default ContactTabContent;