"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Download, Search, X, CalendarIcon, Check } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

// Types
interface MatierePremiere {
  id: string;
  nom: string;
  code: string;
  unite: string;
  paysDestination: string;
  prixActuel: number;
  variationSemaine: { pct: number; valeur: number };
  variationMois: { pct: number; valeur: number };
  variationTrimestre: { pct: number; valeur: number };
  variationAnnee: { pct: number; valeur: number };
  variationPeriode: { pct: number; valeur: number };
  categorie: string;
  groupeFamille: string;
  famille: string;
  sousFamille: string;
  fournisseur: string;
  portefeuille: string;
}

// Données mockées - matières premières cohérentes avec PLS
const matieresPremieres: MatierePremiere[] = [
  {
    id: "1",
    nom: "Farine de blé T55",
    code: "FAR01",
    unite: "Tonne",
    paysDestination: "France",
    prixActuel: 425,
    variationSemaine: { pct: 0.5, valeur: 2.13 },
    variationMois: { pct: 3.2, valeur: 13.60 },
    variationTrimestre: { pct: 5.1, valeur: 21.68 },
    variationAnnee: { pct: 8.2, valeur: 34.85 },
    variationPeriode: { pct: 12.5, valeur: 53.13 },
    categorie: "ŒUF PPI",
    groupeFamille: "Pain/viennoiserie/patisserie",
    famille: "Farine & Levure",
    sousFamille: "Farines blanches",
    fournisseur: "Labeyrie Fine Foods",
    portefeuille: "Tradition & Qualité",
  },
  {
    id: "2",
    nom: "Lait entier UHT",
    code: "LAI02",
    unite: "Litre",
    paysDestination: "France",
    prixActuel: 1.2,
    variationSemaine: { pct: 0.3, valeur: 0.004 },
    variationMois: { pct: 2.1, valeur: 0.025 },
    variationTrimestre: { pct: 4.5, valeur: 0.054 },
    variationAnnee: { pct: 6.8, valeur: 0.082 },
    variationPeriode: { pct: 9.2, valeur: 0.110 },
    categorie: "LAIT BEURRE CREME",
    groupeFamille: "Cremerie",
    famille: "Lait",
    sousFamille: "Lait UHT",
    fournisseur: "Lactalis Foodservice",
    portefeuille: "Premium Gourmet",
  },
  {
    id: "3",
    nom: "Beurre doux 82% MG",
    code: "BEU03",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 8.5,
    variationSemaine: { pct: 1.2, valeur: 0.10 },
    variationMois: { pct: 5.5, valeur: 0.47 },
    variationTrimestre: { pct: 9.8, valeur: 0.83 },
    variationAnnee: { pct: 15.2, valeur: 1.29 },
    variationPeriode: { pct: 22.5, valeur: 1.91 },
    categorie: "LAIT BEURRE CREME",
    groupeFamille: "Cremerie",
    famille: "Beurre",
    sousFamille: "Beurre doux",
    fournisseur: "Lactalis Foodservice",
    portefeuille: "Premium Gourmet",
  },
  {
    id: "4",
    nom: "Fromage Emmental bloc",
    code: "FRO04",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 7.2,
    variationSemaine: { pct: 0.8, valeur: 0.06 },
    variationMois: { pct: 3.5, valeur: 0.25 },
    variationTrimestre: { pct: 6.2, valeur: 0.45 },
    variationAnnee: { pct: 10.5, valeur: 0.76 },
    variationPeriode: { pct: 15.8, valeur: 1.14 },
    categorie: "FROMAGE",
    groupeFamille: "Fromages",
    famille: "Fromages à pâte pressée",
    sousFamille: "Emmental",
    fournisseur: "Lactalis Foodservice",
    portefeuille: "Tradition & Qualité",
  },
  {
    id: "5",
    nom: "Saumon atlantique fumé",
    code: "SAU05",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 28.5,
    variationSemaine: { pct: -0.5, valeur: -0.14 },
    variationMois: { pct: 1.2, valeur: 0.34 },
    variationTrimestre: { pct: 3.8, valeur: 1.08 },
    variationAnnee: { pct: 7.5, valeur: 2.14 },
    variationPeriode: { pct: 11.2, valeur: 3.19 },
    categorie: "SAURISSERIE",
    groupeFamille: "Produits de la mer",
    famille: "Poissons fumés",
    sousFamille: "Saumon fumé",
    fournisseur: "Labeyrie Fine Foods",
    portefeuille: "Premium Gourmet",
  },
  {
    id: "6",
    nom: "Jambon cuit supérieur",
    code: "JAM06",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 9.8,
    variationSemaine: { pct: 0.6, valeur: 0.06 },
    variationMois: { pct: 2.8, valeur: 0.27 },
    variationTrimestre: { pct: 5.2, valeur: 0.51 },
    variationAnnee: { pct: 8.9, valeur: 0.87 },
    variationPeriode: { pct: 13.5, valeur: 1.32 },
    categorie: "SAURISSERIE",
    groupeFamille: "Charcuterie",
    famille: "Jambons",
    sousFamille: "Jambon cuit",
    fournisseur: "Fleury Michon",
    portefeuille: "Tradition & Qualité",
  },
  {
    id: "7",
    nom: "Yaourt nature brassé",
    code: "YAO07",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 2.5,
    variationSemaine: { pct: 0.2, valeur: 0.005 },
    variationMois: { pct: 1.8, valeur: 0.045 },
    variationTrimestre: { pct: 3.5, valeur: 0.088 },
    variationAnnee: { pct: 5.8, valeur: 0.145 },
    variationPeriode: { pct: 8.5, valeur: 0.213 },
    categorie: "ULTRA FRAIS",
    groupeFamille: "Ultra frais",
    famille: "Yaourts",
    sousFamille: "Yaourts natures",
    fournisseur: "Danone Professionnel",
    portefeuille: "Bio & Responsable",
  },
  {
    id: "8",
    nom: "Pommes de terre surgel.",
    code: "PDT08",
    unite: "Kg",
    paysDestination: "France",
    prixActuel: 1.8,
    variationSemaine: { pct: 0.4, valeur: 0.007 },
    variationMois: { pct: 2.2, valeur: 0.040 },
    variationTrimestre: { pct: 4.1, valeur: 0.074 },
    variationAnnee: { pct: 6.5, valeur: 0.117 },
    variationPeriode: { pct: 9.8, valeur: 0.176 },
    categorie: "SURGELE VIANDES LEGUMES",
    groupeFamille: "Produits surgelés",
    famille: "Légumes surgelés",
    sousFamille: "Pommes de terre",
    fournisseur: "Picard Surgelés",
    portefeuille: "Economique",
  },
  {
    id: "9",
    nom: "Glace vanille premium",
    code: "GLA09",
    unite: "Litre",
    paysDestination: "France",
    prixActuel: 8.5,
    variationSemaine: { pct: 0.3, valeur: 0.026 },
    variationMois: { pct: 1.5, valeur: 0.128 },
    variationTrimestre: { pct: 3.2, valeur: 0.272 },
    variationAnnee: { pct: 5.5, valeur: 0.468 },
    variationPeriode: { pct: 8.2, valeur: 0.697 },
    categorie: "SURGELES GLACE PPI",
    groupeFamille: "Glaces/desserts surgelés",
    famille: "Glaces",
    sousFamille: "Glaces vanille",
    fournisseur: "Nestlé Professional",
    portefeuille: "Premium Gourmet",
  },
  {
    id: "10",
    nom: "Filet poulet surgelé",
    code: "POU10",
    unite: "Kg",
    paysDestination: "Espagne",
    prixActuel: 6.5,
    variationSemaine: { pct: 0.7, valeur: 0.046 },
    variationMois: { pct: 3.1, valeur: 0.202 },
    variationTrimestre: { pct: 5.8, valeur: 0.377 },
    variationAnnee: { pct: 9.2, valeur: 0.598 },
    variationPeriode: { pct: 14.5, valeur: 0.943 },
    categorie: "SURGELE VIANDES LEGUMES",
    groupeFamille: "Produits surgelés",
    famille: "Volailles surgelées",
    sousFamille: "Poulet",
    fournisseur: "Sysco France",
    portefeuille: "Tradition & Qualité",
  },
  {
    id: "11",
    nom: "Crème fraîche épaisse 35%",
    code: "CRE11",
    unite: "Litre",
    paysDestination: "Belgique",
    prixActuel: 4.2,
    variationSemaine: { pct: 0.5, valeur: 0.021 },
    variationMois: { pct: 2.5, valeur: 0.105 },
    variationTrimestre: { pct: 4.8, valeur: 0.202 },
    variationAnnee: { pct: 7.5, valeur: 0.315 },
    variationPeriode: { pct: 11.2, valeur: 0.470 },
    categorie: "LAIT BEURRE CREME",
    groupeFamille: "Cremerie",
    famille: "Crème",
    sousFamille: "Crème épaisse",
    fournisseur: "Lactalis Foodservice",
    portefeuille: "Premium Gourmet",
  },
  {
    id: "12",
    nom: "Œufs frais calibre M",
    code: "OEU12",
    unite: "Pièce",
    paysDestination: "France",
    prixActuel: 0.25,
    variationSemaine: { pct: 2.5, valeur: 0.006 },
    variationMois: { pct: 8.5, valeur: 0.021 },
    variationTrimestre: { pct: 15.2, valeur: 0.038 },
    variationAnnee: { pct: 25.5, valeur: 0.064 },
    variationPeriode: { pct: 38.2, valeur: 0.096 },
    categorie: "ŒUF PPI",
    groupeFamille: "Cremerie",
    famille: "Œufs",
    sousFamille: "Œufs frais",
    fournisseur: "Transgourmet",
    portefeuille: "Economique",
  },
];

// Données graphique évolution - avec différentes périodes
const evolutionDataMois = [
  { date: "04/24", FAR01: 250, LAI02: 0.9, BEU03: 6.5, FRO04: 5.8, SAU05: 24.5, JAM06: 8.2, YAO07: 2.1, PDT08: 1.5, GLA09: 7.2, POU10: 5.5, CRE11: 3.5, OEU12: 0.18 },
  { date: "05/24", FAR01: 260, LAI02: 0.95, BEU03: 6.8, FRO04: 6.0, SAU05: 25.0, JAM06: 8.5, YAO07: 2.15, PDT08: 1.55, GLA09: 7.4, POU10: 5.7, CRE11: 3.6, OEU12: 0.19 },
  { date: "06/24", FAR01: 270, LAI02: 1.0, BEU03: 7.0, FRO04: 6.2, SAU05: 25.5, JAM06: 8.7, YAO07: 2.2, PDT08: 1.6, GLA09: 7.6, POU10: 5.9, CRE11: 3.7, OEU12: 0.20 },
  { date: "07/24", FAR01: 285, LAI02: 1.05, BEU03: 7.2, FRO04: 6.4, SAU05: 26.0, JAM06: 8.9, YAO07: 2.25, PDT08: 1.65, GLA09: 7.8, POU10: 6.0, CRE11: 3.8, OEU12: 0.21 },
  { date: "08/24", FAR01: 300, LAI02: 1.08, BEU03: 7.5, FRO04: 6.6, SAU05: 26.5, JAM06: 9.1, YAO07: 2.3, PDT08: 1.7, GLA09: 8.0, POU10: 6.2, CRE11: 3.9, OEU12: 0.22 },
  { date: "09/24", FAR01: 320, LAI02: 1.1, BEU03: 7.8, FRO04: 6.8, SAU05: 27.0, JAM06: 9.3, YAO07: 2.35, PDT08: 1.72, GLA09: 8.2, POU10: 6.3, CRE11: 4.0, OEU12: 0.23 },
  { date: "10/24", FAR01: 340, LAI02: 1.12, BEU03: 8.0, FRO04: 7.0, SAU05: 27.5, JAM06: 9.5, YAO07: 2.4, PDT08: 1.75, GLA09: 8.3, POU10: 6.4, CRE11: 4.1, OEU12: 0.24 },
  { date: "11/24", FAR01: 360, LAI02: 1.15, BEU03: 8.2, FRO04: 7.1, SAU05: 28.0, JAM06: 9.7, YAO07: 2.45, PDT08: 1.78, GLA09: 8.4, POU10: 6.45, CRE11: 4.15, OEU12: 0.245 },
  { date: "12/24", FAR01: 380, LAI02: 1.18, BEU03: 8.4, FRO04: 7.15, SAU05: 28.3, JAM06: 9.75, YAO07: 2.48, PDT08: 1.8, GLA09: 8.5, POU10: 6.5, CRE11: 4.2, OEU12: 0.25 },
];

const evolutionDataSemaine = [
  { date: "S48", FAR01: 360, LAI02: 1.15, BEU03: 8.2, FRO04: 7.1, SAU05: 28.0, JAM06: 9.7, YAO07: 2.45, PDT08: 1.78, GLA09: 8.4, POU10: 6.45, CRE11: 4.15, OEU12: 0.245 },
  { date: "S49", FAR01: 365, LAI02: 1.16, BEU03: 8.25, FRO04: 7.12, SAU05: 28.1, JAM06: 9.72, YAO07: 2.46, PDT08: 1.79, GLA09: 8.42, POU10: 6.47, CRE11: 4.17, OEU12: 0.246 },
  { date: "S50", FAR01: 370, LAI02: 1.17, BEU03: 8.3, FRO04: 7.13, SAU05: 28.15, JAM06: 9.73, YAO07: 2.47, PDT08: 1.79, GLA09: 8.45, POU10: 6.48, CRE11: 4.18, OEU12: 0.248 },
  { date: "S51", FAR01: 375, LAI02: 1.175, BEU03: 8.35, FRO04: 7.14, SAU05: 28.2, JAM06: 9.74, YAO07: 2.475, PDT08: 1.795, GLA09: 8.47, POU10: 6.49, CRE11: 4.19, OEU12: 0.249 },
  { date: "S52", FAR01: 380, LAI02: 1.18, BEU03: 8.4, FRO04: 7.15, SAU05: 28.3, JAM06: 9.75, YAO07: 2.48, PDT08: 1.8, GLA09: 8.5, POU10: 6.5, CRE11: 4.2, OEU12: 0.25 },
];

const evolutionDataJour = [
  { date: "01/12", FAR01: 375, LAI02: 1.175, BEU03: 8.35, FRO04: 7.14, SAU05: 28.2, JAM06: 9.74, YAO07: 2.475, PDT08: 1.795, GLA09: 8.47, POU10: 6.49, CRE11: 4.19, OEU12: 0.249 },
  { date: "02/12", FAR01: 376, LAI02: 1.176, BEU03: 8.36, FRO04: 7.14, SAU05: 28.22, JAM06: 9.74, YAO07: 2.476, PDT08: 1.796, GLA09: 8.48, POU10: 6.49, CRE11: 4.19, OEU12: 0.2492 },
  { date: "03/12", FAR01: 377, LAI02: 1.177, BEU03: 8.37, FRO04: 7.145, SAU05: 28.24, JAM06: 9.745, YAO07: 2.477, PDT08: 1.797, GLA09: 8.485, POU10: 6.495, CRE11: 4.195, OEU12: 0.2494 },
  { date: "04/12", FAR01: 378, LAI02: 1.178, BEU03: 8.38, FRO04: 7.145, SAU05: 28.26, JAM06: 9.746, YAO07: 2.478, PDT08: 1.798, GLA09: 8.49, POU10: 6.496, CRE11: 4.196, OEU12: 0.2496 },
  { date: "05/12", FAR01: 379, LAI02: 1.179, BEU03: 8.39, FRO04: 7.148, SAU05: 28.28, JAM06: 9.748, YAO07: 2.479, PDT08: 1.799, GLA09: 8.495, POU10: 6.498, CRE11: 4.198, OEU12: 0.2498 },
  { date: "06/12", FAR01: 380, LAI02: 1.18, BEU03: 8.4, FRO04: 7.15, SAU05: 28.3, JAM06: 9.75, YAO07: 2.48, PDT08: 1.8, GLA09: 8.5, POU10: 6.5, CRE11: 4.2, OEU12: 0.25 },
];

// Données graphique annuel
const annualData = [
  { mois: "01", 2019: 350, 2020: null, 2021: 340, 2022: null, 2023: 360, 2024: 250, 2025: null },
  { mois: "02", 2019: 355, 2020: null, 2021: 345, 2022: null, 2023: 365, 2024: 260, 2025: null },
  { mois: "03", 2019: 360, 2020: 380, 2021: 350, 2022: 390, 2023: 370, 2024: 270, 2025: null },
  { mois: "04", 2019: 250, 2020: 380, 2021: 250, 2022: 390, 2023: 250, 2024: 270, 2025: 360 },
  { mois: "05", 2019: 260, 2020: 385, 2021: 260, 2022: 395, 2023: 260, 2024: 280, 2025: 365 },
  { mois: "06", 2019: 270, 2020: 390, 2021: 270, 2022: 270, 2023: 270, 2024: 290, 2025: 370 },
  { mois: "07", 2019: 285, 2020: 395, 2021: 285, 2022: null, 2023: 420, 2024: 300, 2025: 285 },
  { mois: "08", 2019: 300, 2020: 400, 2021: 420, 2022: null, 2023: 430, 2024: 320, 2025: 300 },
  { mois: "09", 2019: 320, 2020: 405, 2021: 440, 2022: null, 2023: 440, 2024: 340, 2025: 320 },
  { mois: "10", 2019: 340, 2020: 410, 2021: 460, 2022: null, 2023: 450, 2024: 360, 2025: 340 },
  { mois: "11", 2019: 360, 2020: 415, 2021: 480, 2022: null, 2023: 460, 2024: 380, 2025: 360 },
  { mois: "12", 2019: 380, 2020: 420, 2021: 500, 2022: null, 2023: 470, 2024: 400, 2025: 380 },
];

const years = [
  { year: "2019", color: "#ef4444" },
  { year: "2020", color: "#3b82f6" },
  { year: "2021", color: "#10b981" },
  { year: "2022", color: "#f59e0b" },
  { year: "2023", color: "#8b5cf6" },
  { year: "2024", color: "#ec4899" },
  { year: "2025", color: "#6366f1" },
];

const matiereColors = ["#E91E63", "#607D8B", "#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4", "#8BC34A", "#FF5722", "#795548", "#607D8B", "#3F51B5"];

export default function CoursMatieresPremieres() {
  // États filtres
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 11, 11),
    to: new Date(2024, 11, 14),
  });
  const [paysDestination, setPaysDestination] = useState("tous");
  const [unite, setUnite] = useState("tous");
  const [categorie, setCategorie] = useState("tous");
  const [groupeFamille, setGroupeFamille] = useState("tous");
  const [famille, setFamille] = useState("tous");
  const [sousFamille, setSousFamille] = useState("tous");
  const [fournisseur, setFournisseur] = useState("tous");
  const [portefeuille, setPortefeuille] = useState("tous");

  // État recherche fournisseur
  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [openFournisseur, setOpenFournisseur] = useState(false);

  // États recherche et sélection
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMatieres, setSelectedMatieres] = useState<MatierePremiere[]>([
    matieresPremieres[0],
    matieresPremieres[4],
  ]);

  // États graphiques
  const [periodeGraphique, setPeriodeGraphique] = useState<"mois" | "semaine" | "jour">("mois");
  const [base100, setBase100] = useState(false);
  const [evolutionDateRange, setEvolutionDateRange] = useState([0, 100]);

  const [periodeAnnuelle, setPeriodeAnnuelle] = useState("mois");
  const [base100Annuel, setBase100Annuel] = useState(false);
  const [matiereSelectionneeAnnuelle, setMatiereSelectionneeAnnuelle] = useState("FAR01");
  const [selectedYears, setSelectedYears] = useState(["2019", "2020", "2021", "2022", "2023", "2024", "2025"]);
  const [annuelDateRange, setAnnuelDateRange] = useState([0, 100]);

  // Obtenir les données graphique selon la période
  const getEvolutionData = () => {
    const data = (() => {
      switch (periodeGraphique) {
        case "semaine":
          return evolutionDataSemaine;
        case "jour":
          return evolutionDataJour;
        default:
          return evolutionDataMois;
      }
    })();

    // Appliquer Base 100 si activé
    if (base100 && data.length > 0) {
      const firstValues: Record<string, number> = {};
      selectedMatieres.forEach((matiere) => {
        firstValues[matiere.code] = data[0][matiere.code as keyof typeof data[0]] as number || 100;
      });

      return data.map((item) => {
        const newItem: any = { date: item.date };
        selectedMatieres.forEach((matiere) => {
          const value = item[matiere.code as keyof typeof item] as number;
          newItem[matiere.code] = (value / firstValues[matiere.code]) * 100;
        });
        return newItem;
      });
    }

    return data;
  };

  // Filtrage des matières pour l'autocomplétion
  const filteredMatieres = useMemo(() => {
    return matieresPremieres.filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPays = paysDestination === "tous" || m.paysDestination === paysDestination;
      const matchCategorie = categorie === "tous" || m.categorie === categorie;
      const matchGroupeFamille = groupeFamille === "tous" || m.groupeFamille === groupeFamille;
      const matchFamille = famille === "tous" || m.famille === famille;
      const matchSousFamille = sousFamille === "tous" || m.sousFamille === sousFamille;
      const matchFournisseur = fournisseur === "tous" || m.fournisseur === fournisseur;
      const matchPortefeuille = portefeuille === "tous" || m.portefeuille === portefeuille;

      return (
        matchSearch &&
        matchPays &&
        matchCategorie &&
        matchGroupeFamille &&
        matchFamille &&
        matchSousFamille &&
        matchFournisseur &&
        matchPortefeuille
      );
    });
  }, [searchTerm, paysDestination, categorie, groupeFamille, famille, sousFamille, fournisseur, portefeuille]);

  const handleSelectMatiere = useCallback(
    (matiere: MatierePremiere) => {
      if (!selectedMatieres.find((m) => m.id === matiere.id)) {
        setSelectedMatieres([...selectedMatieres, matiere]);
      }
      setSearchTerm("");
      setShowDropdown(false);
    },
    [selectedMatieres]
  );

  const handleRemoveMatiere = useCallback(
    (id: string) => {
      setSelectedMatieres(selectedMatieres.filter((m) => m.id !== id));
    },
    [selectedMatieres]
  );

  const toggleYear = useCallback(
    (year: string) => {
      if (selectedYears.includes(year)) {
        setSelectedYears(selectedYears.filter((y) => y !== year));
      } else {
        setSelectedYears([...selectedYears, year]);
      }
    },
    [selectedYears]
  );

  const unselectAllYears = useCallback(() => {
    setSelectedYears([]);
  }, []);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = useMemo(() => {
    return (
      paysDestination !== "tous" ||
      unite !== "tous" ||
      categorie !== "tous" ||
      groupeFamille !== "tous" ||
      famille !== "tous" ||
      sousFamille !== "tous" ||
      fournisseur !== "tous" ||
      portefeuille !== "tous"
    );
  }, [paysDestination, unite, categorie, groupeFamille, famille, sousFamille, fournisseur, portefeuille]);

  const handleResetFilters = useCallback(() => {
    setPaysDestination("tous");
    setUnite("tous");
    setCategorie("tous");
    setGroupeFamille("tous");
    setFamille("tous");
    setSousFamille("tous");
    setFournisseur("tous");
    setPortefeuille("tous");
  }, []);

  // Obtenir les options filtrées selon les filtres actifs
  const getFilteredOptions = (filterType: string) => {
    const filtered = matieresPremieres.filter((m) => {
      if (filterType === "categorie") return true;
      if (categorie !== "tous" && m.categorie !== categorie && filterType !== "categorie") return false;
      if (filterType === "groupeFamille") return true;
      if (groupeFamille !== "tous" && m.groupeFamille !== groupeFamille && filterType !== "groupeFamille") return false;
      if (filterType === "famille") return true;
      if (famille !== "tous" && m.famille !== famille && filterType !== "famille") return false;
      if (filterType === "sousFamille") return true;
      return true;
    });

    const uniqueValues = new Set<string>();
    filtered.forEach((item) => {
      if (filterType in item) {
        uniqueValues.add(item[filterType as keyof MatierePremiere] as string);
      }
    });

    return Array.from(uniqueValues).sort();
  };

  const fournisseurs = ["Labeyrie Fine Foods", "Picard Surgelés", "Lactalis Foodservice", "Fleury Michon", "Danone Professionnel", "Nestlé Professional", "Sysco France", "Transgourmet", "Metro Cash & Carry", "Brake France"];
  const filteredFournisseurs = fournisseurs.filter((f) => f.toLowerCase().includes(fournisseurSearch.toLowerCase()));

  return (
    <main className="w-full px-[50px] py-4">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-[40px] font-bold">Cours des matières premières</h1>
      </div>

      {/* FILTRES - Ligne 1 : Période, Pays */}
      <div className="mb-6 flex flex-wrap gap-x-2 gap-y-4">
        {/* Période */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-auto justify-between border-gray-200 bg-white font-normal shadow-none">
                  11/12/2024 - 14/12/2024
                  <CalendarIcon className="h-4 w-4 text-blue" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Pays destination */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Pays destination</Label>
            <Select value={paysDestination} onValueChange={setPaysDestination}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                <SelectItem value="France" className="py-3">France</SelectItem>
                <SelectItem value="Espagne" className="py-3">Espagne</SelectItem>
                <SelectItem value="Belgique" className="py-3">Belgique</SelectItem>
                <SelectItem value="Roumanie" className="py-3">Roumanie</SelectItem>
                <SelectItem value="Pologne" className="py-3">Pologne</SelectItem>
                <SelectItem value="Italie" className="py-3">Italie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Unité */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Unité</Label>
            <Select value={unite} onValueChange={setUnite}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                <SelectItem value="m³" className="py-3">Cubic mètre (m³)</SelectItem>
                <SelectItem value="Kg" className="py-3">Kilogramme (Kg)</SelectItem>
                <SelectItem value="T" className="py-3">Tonne (T)</SelectItem>
                <SelectItem value="L" className="py-3">Litre (L)</SelectItem>
                <SelectItem value="m²" className="py-3">Mètre carré (m²)</SelectItem>
                <SelectItem value="U" className="py-3">Unité (U)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* FILTRES - Ligne 2 : Filtres hiérarchiques */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Catégorie */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Catégorie</Label>
            <Select value={categorie} onValueChange={(v) => { setCategorie(v); setGroupeFamille("tous"); setFamille("tous"); setSousFamille("tous"); }}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                {getFilteredOptions("categorie").map((option) => (
                  <SelectItem key={option} value={option} className="py-3">{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Groupe Famille */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Groupe Famille</Label>
            <Select value={groupeFamille} onValueChange={(v) => { setGroupeFamille(v); setFamille("tous"); setSousFamille("tous"); }}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                {getFilteredOptions("groupeFamille").map((option) => (
                  <SelectItem key={option} value={option} className="py-3">{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Famille */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Famille</Label>
            <Select value={famille} onValueChange={(v) => { setFamille(v); setSousFamille("tous"); }}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                {getFilteredOptions("famille").map((option) => (
                  <SelectItem key={option} value={option} className="py-3">{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Sous famille */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Sous famille</Label>
            <Select value={sousFamille} onValueChange={setSousFamille}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                {getFilteredOptions("sousFamille").map((option) => (
                  <SelectItem key={option} value={option} className="py-3">{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Fournisseur avec recherche */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Fournisseur</Label>
            <Select value={fournisseur} onValueChange={setFournisseur}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-2">
                  <Input
                    placeholder="Rechercher fournisseur..."
                    value={fournisseurSearch}
                    onChange={(e) => setFournisseurSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                {filteredFournisseurs.map((f) => (
                  <SelectItem key={f} value={f} className="py-3">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Portefeuille */}
        <Card className="border-[#EBEBEB] bg-[#F7F7F7] rounded p-2 shadow-none">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700 break-words">Portefeuille</Label>
            <Select value={portefeuille} onValueChange={setPortefeuille}>
              <SelectTrigger className="w-auto border-gray-200 bg-white shadow-none">
                <SelectValue placeholder="tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous" className="py-3">tous</SelectItem>
                <SelectItem value="Premium Gourmet" className="py-3">Premium Gourmet</SelectItem>
                <SelectItem value="Tradition & Qualité" className="py-3">Tradition & Qualité</SelectItem>
                <SelectItem value="Economique" className="py-3">Economique</SelectItem>
                <SelectItem value="Bio & Responsable" className="py-3">Bio & Responsable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Bouton Réinitialiser */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleResetFilters} className="h-[52px] border-gray-300 bg-white hover:bg-gray-50">
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Input recherche avec autocomplétion */}
      <div className="mt-4">
        <Popover open={showDropdown} onOpenChange={setShowDropdown}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={showDropdown}
              className="w-full max-w-[500px] h-[52px] justify-between border-[#EBEBEB] bg-[#ffffff] rounded font-normal shadow-none mb-6"
            >
            {searchTerm || "Rechercher une matière première"}
            {searchTerm ? (
              <span
                role="button"
                tabIndex={0}
                className="ml-2 cursor-pointer inline-flex"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchTerm("");
                  setShowDropdown(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchTerm("");
                    setShowDropdown(false);
                  }
                }}
              >
                <X className="h-4 w-4 shrink-0 hover:opacity-70" />
              </span>
            ) : (
              <Search className="ml-2 h-4 w-4 shrink-0 text-blue" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Rechercher une matière première..."
            />
            <CommandList>
              <CommandEmpty>Aucune matière première trouvée.</CommandEmpty>
              <CommandGroup>
                {filteredMatieres.map((matiere) => (
                  <CommandItem key={matiere.id} value={matiere.nom} onSelect={() => handleSelectMatiere(matiere)} className="py-2">
                    <Check className={cn("mr-2 h-4 w-4", selectedMatieres.find(m => m.id === matiere.id) ? "opacity-100" : "opacity-0")} />
                    <span className="font-medium text-gray-700">{matiere.code}</span>
                    <span className="text-gray-600 ml-2">- {matiere.nom}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      </div>

      {/* Tags matières sélectionnées */}
      {selectedMatieres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedMatieres.map((matiere) => (
            <TooltipProvider key={matiere.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 cursor-default">
                    <span className="text-[14px] font-medium">{matiere.code} - {matiere.nom}</span>
                    <button onClick={() => handleRemoveMatiere(matiere.id)} className="text-[#0970E6] hover:text-blue-800">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>Unité: {matiere.unite}</div>
                  <div>Pays destination: {matiere.paysDestination}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Section Evolution de cours */}
      <div className="mb-6">
        <h2 className="text-[16px] font-ubuntu font-medium text-gray-900 mb-4">Evolution de cours</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-end gap-3 mb-4">
            <Select value={periodeGraphique} onValueChange={(v: "mois" | "semaine" | "jour") => setPeriodeGraphique(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mois" className="py-3">Mois</SelectItem>
                <SelectItem value="semaine" className="py-3">Semaine</SelectItem>
                <SelectItem value="jour" className="py-3">Jour</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label htmlFor="base100-evolution">Base 100</Label>
              <Switch id="base100-evolution" checked={base100} onCheckedChange={setBase100} />
            </div>
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Légendes centrées */}
          <div className="flex justify-center items-center gap-4 mb-3">
          <div className="flex flex-wrap gap-4 justify-center">
            {selectedMatieres.map((matiere, index) => (
              <div key={matiere.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: matiereColors[index % matiereColors.length] }} />
                <span className="text-sm text-gray-600">{matiere.code} - {matiere.nom}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getEvolutionData()} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            {selectedMatieres.map((matiere, index) => (
              <Line key={matiere.code} type="monotone" dataKey={matiere.code} stroke={matiereColors[index % matiereColors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>

          {/* Range Slider */}
          <div className="mt-6 px-4">
            <Slider min={0} max={100} step={1} value={evolutionDateRange} onValueChange={setEvolutionDateRange} />
          </div>
        </div>
      </div>

      {/* Tableau Variation des prix */}
      <div className="mb-6">
        <h2 className="text-[16px] font-ubuntu font-medium text-gray-900 mb-4">Variation des prix</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-64 font-semibold">Matières premières</TableHead>
                <TableHead className="font-semibold">Unité</TableHead>
                <TableHead className="font-semibold">Prix actuel</TableHead>
                <TableHead className="font-semibold">Dernière semaine</TableHead>
                <TableHead className="font-semibold">Dernier mois</TableHead>
                <TableHead className="font-semibold">Dernier trimestre</TableHead>
                <TableHead className="font-semibold">Dernière année</TableHead>
                <TableHead className="font-semibold">Sur la période</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMatieres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">Aucune matière première sélectionnée</TableCell>
                </TableRow>
              ) : (
                selectedMatieres.map((matiere) => (
                  <TableRow key={matiere.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="text-[16px] font-bold text-gray-900">{matiere.nom}</div>
                      <div className="text-xs text-gray-500">{matiere.code}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">{matiere.unite}</TableCell>
                    <TableCell className="font-medium text-gray-900">{matiere.prixActuel.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className={cn("font-medium", matiere.variationSemaine.pct >= 0 ? "text-red-600" : "text-green-600")}>
                        {matiere.variationSemaine.pct >= 0 ? "+" : ""}{matiere.variationSemaine.pct}%
                      </div>
                      <div className="text-[16px] text-gray-500">{matiere.variationSemaine.valeur.toLocaleString()} €</div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("font-medium", matiere.variationMois.pct >= 0 ? "text-red-600" : "text-green-600")}>
                        {matiere.variationMois.pct >= 0 ? "+" : ""}{matiere.variationMois.pct}%
                      </div>
                      <div className="text-[16px] text-gray-500">{matiere.variationMois.valeur.toLocaleString()} €</div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("font-medium", matiere.variationTrimestre.pct >= 0 ? "text-red-600" : "text-green-600")}>
                        {matiere.variationTrimestre.pct >= 0 ? "+" : ""}{matiere.variationTrimestre.pct}%
                      </div>
                      <div className="text-[16px] text-gray-500">{matiere.variationTrimestre.valeur.toLocaleString()} €</div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("font-medium", matiere.variationAnnee.pct >= 0 ? "text-red-600" : "text-green-600")}>
                        {matiere.variationAnnee.pct >= 0 ? "+" : ""}{matiere.variationAnnee.pct}%
                      </div>
                      <div className="text-[16px] text-gray-500">{matiere.variationAnnee.valeur.toLocaleString()} €</div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("font-medium", matiere.variationPeriode.pct >= 0 ? "text-red-600" : "text-green-600")}>
                        {matiere.variationPeriode.pct >= 0 ? "+" : ""}{matiere.variationPeriode.pct}%
                      </div>
                      <div className="text-[16px] text-gray-500">{matiere.variationPeriode.valeur.toLocaleString()} €</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section Evolution du cours par année */}
      <div>
        <h2 className="text-[16px] font-ubuntu font-medium text-gray-900 mb-4">Evolution du cours par année</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-end mb-4">
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Légendes années centrées avec bouton unselect à droite */}
          <div className="flex justify-between items-center mb-3">
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {years.map((item) => (
                <button key={item.year} onClick={() => toggleYear(item.year)} className={`flex items-center gap-2 ${selectedYears.includes(item.year) ? "opacity-100" : "opacity-40"}`}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.year}</span>
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={unselectAllYears} className="text-xs">
            Tout désélectionner
          </Button>
        </div>

        {/* Graphique annuel */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={annualData} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            {selectedYears.map((year) => {
              const yearData = years.find((y) => y.year === year);
              return <Line key={year} type="monotone" dataKey={year} stroke={yearData?.color} strokeWidth={2} dot={false} connectNulls={false} />;
            })}
          </LineChart>
        </ResponsiveContainer>

          {/* Range Slider */}
          <div className="mt-6 px-4">
            <Slider min={0} max={100} step={1} value={annuelDateRange} onValueChange={setAnnuelDateRange} />
          </div>
        </div>
      </div>
    </main>
  );
}
