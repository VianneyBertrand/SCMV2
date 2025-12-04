// @ts-nocheck
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
// Lazy load heavy components - Command and Calendar
const LazyCalendar = dynamic(() => import("@/components/ui/calendar").then(mod => ({ default: mod.Calendar })), { ssr: false }) as any;
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { PORTEFEUILLE_NAMES } from "@/lib/constants/portefeuilles";
import { Download, Search, X, CalendarIcon, Check, ChevronDown as ChevronDownIcon, Info, ChevronsUpDown, RotateCcw } from "lucide-react";
import { CurveIcon } from "@/components/ui/curve-icon";
import dynamic from 'next/dynamic';
import { useRestoredPageState } from "@/hooks/usePageState";
import { InlineField } from "@/componentsv2/ui/inline-field";
import { DatePicker as DatePickerV2, type MonthYear } from "@/componentsv2/ui/date-picker";
import { Button as ButtonV2 } from "@/componentsv2/ui/button";
import { Autocomplete } from "@/componentsv2/ui/autocomplete";
import {
  Select as SelectV2,
  SelectContent as SelectContentV2,
  SelectItem as SelectItemV2,
  SelectTrigger as SelectTriggerV2,
  SelectValue as SelectValueV2,
} from "@/componentsv2/ui/select";
import { usePeriodStore } from "@/stores/periodStore";

// Lazy load Recharts components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const RechartsTooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const Brush = dynamic(() => import('recharts').then(mod => ({ default: mod.Brush })), { ssr: false });

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

// Interface pour l'état de la page à persister
interface CoursMatieresPageState {
  paysDestination: string;
  unite: string;
  categorie: string;
  groupeFamille: string;
  famille: string;
  sousFamille: string;
  fournisseur: string;
  portefeuille: string;
  selectedMatieres: MatierePremiere[];
  periodeGraphique: "mois" | "semaine" | "jour";
  base100: boolean;
  base100Annuel: boolean;
  matiereSelectionneeAnnuelle: string;
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
    portefeuille: "Jean Dubois",
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
    portefeuille: "Marie Grivault",
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
    portefeuille: "Pierre Lefebvre",
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
    portefeuille: "Sophie Martin",
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
    portefeuille: "Thomas Bernard",
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
    portefeuille: "Claire Durand",
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
    portefeuille: "Antoine Rousseau",
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
    portefeuille: "Isabelle Mercier",
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
    portefeuille: "Nicolas Laurent",
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
    portefeuille: "Émilie Fournier",
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
    portefeuille: "Jean Dubois",
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
    portefeuille: "Marie Grivault",
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
  // Restaurer l'état sauvegardé
  const restoredState = useRestoredPageState<CoursMatieresPageState>('cours-matieres');

  // Period store (partagé avec les autres pages)
  const period = usePeriodStore((state) => state.period);
  const setPeriod = usePeriodStore((state) => state.setPeriod);

  // États filtres
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 11, 11),
    to: new Date(2024, 11, 14),
  });
  const [paysDestination, setPaysDestination] = useState(restoredState?.paysDestination ?? "tous");
  const [unite, setUnite] = useState(restoredState?.unite ?? "tous");
  const [categorie, setCategorie] = useState(restoredState?.categorie ?? "tous");
  const [groupeFamille, setGroupeFamille] = useState(restoredState?.groupeFamille ?? "tous");
  const [famille, setFamille] = useState(restoredState?.famille ?? "tous");
  const [sousFamille, setSousFamille] = useState(restoredState?.sousFamille ?? "tous");
  const [fournisseur, setFournisseur] = useState(restoredState?.fournisseur ?? "tous");
  const [portefeuille, setPortefeuille] = useState(restoredState?.portefeuille ?? "tous");

  // États recherche et sélection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMatieres, setSelectedMatieres] = useState<MatierePremiere[]>(
    restoredState?.selectedMatieres ?? [
      matieresPremieres[0],
      matieresPremieres[4],
    ]
  );

  // États graphiques
  const [periodeGraphique, setPeriodeGraphique] = useState<"mois" | "semaine" | "jour">(restoredState?.periodeGraphique ?? "mois");
  const [base100, setBase100] = useState(restoredState?.base100 ?? false);
  const [evolutionDateRange, setEvolutionDateRange] = useState([0, 100]);
  const [legendOpacityEvolution, setLegendOpacityEvolution] = useState<Record<string, boolean>>({});

  const [periodeAnnuelle, setPeriodeAnnuelle] = useState("mois");
  const [base100Annuel, setBase100Annuel] = useState(restoredState?.base100Annuel ?? false);
  const [matiereSelectionneeAnnuelle, setMatiereSelectionneeAnnuelle] = useState(restoredState?.matiereSelectionneeAnnuelle ?? "FAR01");
  const [selectedYears, setSelectedYears] = useState(["2019", "2020", "2021", "2022", "2023", "2024", "2025"]);
  const [annuelDateRange, setAnnuelDateRange] = useState([0, 100]);
  const [legendOpacityAnnual, setLegendOpacityAnnual] = useState<Record<string, boolean>>({});

  // État de tri du tableau
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Fonction de tri
  const handleSort = (key: string) => {
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      setSortConfig({ key, direction: 'desc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

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

  // Filtrage des matières pour l'autocomplétion (sans searchTerm, géré par Autocomplete)
  const filteredMatieres = useMemo(() => {
    return matieresPremieres.filter((m) => {
      const matchPays = paysDestination === "tous" || m.paysDestination === paysDestination;
      const matchCategorie = categorie === "tous" || m.categorie === categorie;
      const matchGroupeFamille = groupeFamille === "tous" || m.groupeFamille === groupeFamille;
      const matchFamille = famille === "tous" || m.famille === famille;
      const matchSousFamille = sousFamille === "tous" || m.sousFamille === sousFamille;
      const matchFournisseur = fournisseur === "tous" || m.fournisseur === fournisseur;
      const matchPortefeuille = portefeuille === "tous" || m.portefeuille === portefeuille;

      return (
        matchPays &&
        matchCategorie &&
        matchGroupeFamille &&
        matchFamille &&
        matchSousFamille &&
        matchFournisseur &&
        matchPortefeuille
      );
    });
  }, [paysDestination, categorie, groupeFamille, famille, sousFamille, fournisseur, portefeuille]);

  // Options pour l'Autocomplete
  const autocompleteOptions = useMemo(() => {
    return filteredMatieres.map((m) => ({
      value: m.id,
      label: `${m.code} - ${m.nom}`,
      data: m,
    }));
  }, [filteredMatieres]);

  const handleSelectMatiere = useCallback(
    (matiere: MatierePremiere) => {
      if (!selectedMatieres.find((m) => m.id === matiere.id)) {
        setSelectedMatieres([...selectedMatieres, matiere]);
      }
      setSearchTerm("");
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
      setLegendOpacityAnnual(prev => ({
        ...prev,
        [year]: !prev[year]
      }));
    },
    []
  );

  const unselectAllYears = useCallback(() => {
    const allFalse: Record<string, boolean> = {};
    years.forEach(y => {
      allFalse[y.year] = false;
    });
    setLegendOpacityAnnual(allFalse);
  }, []);

  const toggleMatiere = useCallback(
    (code: string) => {
      setLegendOpacityEvolution(prev => ({
        ...prev,
        [code]: !prev[code]
      }));
    },
    []
  );

  const unselectAllMatieres = useCallback(() => {
    const allFalse: Record<string, boolean> = {};
    selectedMatieres.forEach(m => {
      allFalse[m.code] = false;
    });
    setLegendOpacityEvolution(allFalse);
  }, [selectedMatieres]);

  // S'assurer que la matière sélectionnée pour le graphique annuel est valide
  useEffect(() => {
    if (selectedMatieres.length > 0) {
      const matiereExiste = selectedMatieres.find(m => m.code === matiereSelectionneeAnnuelle);
      if (!matiereExiste) {
        setMatiereSelectionneeAnnuelle(selectedMatieres[0].code);
      }
    }
  }, [selectedMatieres, matiereSelectionneeAnnuelle]);

  // Sauvegarder l'état de la page à chaque changement
  useEffect(() => {
    const pageState: CoursMatieresPageState = {
      paysDestination,
      unite,
      categorie,
      groupeFamille,
      famille,
      sousFamille,
      fournisseur,
      portefeuille,
      selectedMatieres,
      periodeGraphique,
      base100,
      base100Annuel,
      matiereSelectionneeAnnuelle,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('page-state-cours-matieres', JSON.stringify(pageState));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état:', error);
      }
    }
  }, [paysDestination, unite, categorie, groupeFamille, famille, sousFamille, fournisseur, portefeuille, selectedMatieres, periodeGraphique, base100, base100Annuel, matiereSelectionneeAnnuelle]);

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

  // Fonction pour trier les matières premières
  const getSortedMatieres = () => {
    if (!sortConfig) return selectedMatieres;

    const sorted = [...selectedMatieres].sort((a, b) => {
      const { key, direction } = sortConfig;

      let aValue: any = a[key as keyof MatierePremiere];
      let bValue: any = b[key as keyof MatierePremiere];

      // Gérer les objets de variation
      if (key === 'variationSemaine' || key === 'variationMois' || key === 'variationTrimestre' || key === 'variationAnnee' || key === 'variationPeriode') {
        aValue = (a[key as keyof MatierePremiere] as any).pct;
        bValue = (b[key as keyof MatierePremiere] as any).pct;
      }

      if (typeof aValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  };

  const fournisseurs = ["Labeyrie Fine Foods", "Picard Surgelés", "Lactalis Foodservice", "Fleury Michon", "Danone Professionnel", "Nestlé Professional", "Sysco France", "Transgourmet", "Metro Cash & Carry", "Brake France"];

  return (
    <main className="w-full px-6 py-4">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-[40px] font-bold">Cours des matières premières</h1>
      </div>

      {/* FILTRES - Ligne 1 : Période, Pays */}
      <div className="mb-6 flex flex-wrap gap-x-2 gap-y-4">
        {/* Période */}
        <InlineField label="Période">
          <DatePickerV2
            mode="period"
            size="sm"
            value={period}
            onValueChange={setPeriod}
            minDate={{ month: 0, year: 2018 }}
            maxDate={{ month: 11, year: 2025 }}
            showValidateButton
          />
        </InlineField>

        {/* Pays destination */}
        <InlineField label="Pays destination">
          <SelectV2 value={paysDestination} onValueChange={setPaysDestination}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              <SelectItemV2 value="France">France</SelectItemV2>
              <SelectItemV2 value="Espagne">Espagne</SelectItemV2>
              <SelectItemV2 value="Belgique">Belgique</SelectItemV2>
              <SelectItemV2 value="Roumanie">Roumanie</SelectItemV2>
              <SelectItemV2 value="Pologne">Pologne</SelectItemV2>
              <SelectItemV2 value="Italie">Italie</SelectItemV2>
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Unité */}
        <InlineField label="Unité">
          <SelectV2 value={unite} onValueChange={setUnite}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              <SelectItemV2 value="m³">Cubic mètre (m³)</SelectItemV2>
              <SelectItemV2 value="Kg">Kilogramme (Kg)</SelectItemV2>
              <SelectItemV2 value="T">Tonne (T)</SelectItemV2>
              <SelectItemV2 value="L">Litre (L)</SelectItemV2>
              <SelectItemV2 value="m²">Mètre carré (m²)</SelectItemV2>
              <SelectItemV2 value="U">Unité (U)</SelectItemV2>
            </SelectContentV2>
          </SelectV2>
        </InlineField>
      </div>

      {/* FILTRES - Ligne 2 : Filtres hiérarchiques */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Catégorie */}
        <InlineField label="Catégorie">
          <SelectV2 value={categorie} onValueChange={(v) => { setCategorie(v); setGroupeFamille("tous"); setFamille("tous"); setSousFamille("tous"); }}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {getFilteredOptions("categorie").map((option) => (
                <SelectItemV2 key={option} value={option}>{option}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Groupe Famille */}
        <InlineField label="Groupe Famille">
          <SelectV2 value={groupeFamille} onValueChange={(v) => { setGroupeFamille(v); setFamille("tous"); setSousFamille("tous"); }}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {getFilteredOptions("groupeFamille").map((option) => (
                <SelectItemV2 key={option} value={option}>{option}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Famille */}
        <InlineField label="Famille">
          <SelectV2 value={famille} onValueChange={(v) => { setFamille(v); setSousFamille("tous"); }}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {getFilteredOptions("famille").map((option) => (
                <SelectItemV2 key={option} value={option}>{option}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Sous famille */}
        <InlineField label="Sous famille">
          <SelectV2 value={sousFamille} onValueChange={setSousFamille}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {getFilteredOptions("sousFamille").map((option) => (
                <SelectItemV2 key={option} value={option}>{option}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Fournisseur */}
        <InlineField label="Fournisseur">
          <SelectV2 value={fournisseur} onValueChange={setFournisseur}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {fournisseurs.map((f) => (
                <SelectItemV2 key={f} value={f}>{f}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Portefeuille */}
        <InlineField label="Portefeuille">
          <SelectV2 value={portefeuille} onValueChange={setPortefeuille}>
            <SelectTriggerV2 size="sm">
              <SelectValueV2 placeholder="tous" />
            </SelectTriggerV2>
            <SelectContentV2>
              <SelectItemV2 value="tous">tous</SelectItemV2>
              {PORTEFEUILLE_NAMES.map((nom) => (
                <SelectItemV2 key={nom} value={nom}>{nom}</SelectItemV2>
              ))}
            </SelectContentV2>
          </SelectV2>
        </InlineField>

        {/* Bouton Réinitialiser */}
        <ButtonV2
          variant="outline"
          onClick={handleResetFilters}
          className={hasActiveFilters ? "" : "invisible"}
        >
          Réinitialiser
        </ButtonV2>
      </div>

      {/* Input recherche avec autocomplétion */}
      <div className="mt-4 mb-6">
        <Autocomplete
          options={autocompleteOptions}
          value={searchTerm}
          onValueChange={(value) => {
            // Vérifier si c'est une sélection (id de matière)
            const selectedMatiere = filteredMatieres.find((m) => m.id === value);
            if (selectedMatiere) {
              handleSelectMatiere(selectedMatiere);
              setSearchTerm("");
            } else {
              setSearchTerm(value);
            }
          }}
          placeholder="Rechercher une matière première"
          emptyMessage="Aucune matière première trouvée."
          minChars={3}
          size="md"
          className="w-full max-w-[500px]"
          hideSearchIcon
          renderItem={(option) => (
            <div className="flex items-center">
              <Check className={cn("mr-2 h-4 w-4", selectedMatieres.find(m => m.id === option.value) ? "opacity-100" : "opacity-0")} />
              <span className="font-medium text-gray-700">{(option.data as MatierePremiere)?.code}</span>
              <span className="text-gray-600 ml-2">- {(option.data as MatierePremiere)?.nom}</span>
            </div>
          )}
          endAddon={
            searchTerm ? (
              <X
                className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
              />
            ) : (
              <Search className="h-5 w-5 text-primary" />
            )
          }
        />
      </div>

      {/* Tags matières sélectionnées */}
      {selectedMatieres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-[#D9D9D9]">
          {selectedMatieres.map((matiere) => (
            <TooltipProvider key={matiere.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-white text-foreground px-3 py-1.5 rounded-full border border-neutral cursor-default">
                    <span className="text-[14px] font-medium">{matiere.code} - {matiere.nom}</span>
                    <button onClick={() => handleRemoveMatiere(matiere.id)} className="text-primary hover:text-primary/80">
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
      <div className="mb-12">
        <div className="bg-white">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-[20px] font-medium text-gray-900">Evolution de cours</h2>
            <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="base100-evolution">Base 100</Label>
              <Switch id="base100-evolution" checked={base100} onCheckedChange={setBase100} />
            </div>
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
            <Button variant="ghost" size="icon" className="p-0">
              <Download className="text-[#0970E6]" width={24} height={24} />
            </Button>
            </div>
          </div>

          {/* Légendes centrées */}
          <div className="flex justify-center items-center gap-6 mb-2">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {selectedMatieres.map((matiere, index) => (
              <div
                key={matiere.id}
                className="flex items-center gap-2 cursor-pointer"
                style={{ opacity: legendOpacityEvolution[matiere.code] === false ? 0.4 : 1 }}
                onClick={() => toggleMatiere(matiere.code)}
              >
                <CurveIcon color={matiereColors[index % matiereColors.length]} className="w-[30px] h-[14px]" />
                <span className="text-sm select-none">{matiere.code} - {matiere.nom}</span>
              </div>
            ))}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2" onClick={unselectAllMatieres}>
                  <RotateCcw className="w-4 h-4 text-[#0970E6]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tout désélectionner</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Graphique */}
        <div className="overflow-hidden">
        <ResponsiveContainer width="100%" height={400} style={{ paddingBottom: '20px' }}>
          <LineChart data={getEvolutionData()} margin={{ left: -30, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            {selectedMatieres.map((matiere, index) => (
              <Line
                key={matiere.code}
                type="monotone"
                dataKey={matiere.code}
                stroke={matiereColors[index % matiereColors.length]}
                strokeWidth={2}
                dot={false}
                hide={legendOpacityEvolution[matiere.code] === false}
              />
            ))}
            <Brush dataKey="date" height={30} stroke="#0970E6" fill="#FFFFFF" />
          </LineChart>
        </ResponsiveContainer>
        </div>
        </div>
      </div>

      {/* Tableau Variation des prix */}
      <div className="mb-12">
        <h2 className="text-[20px] font-medium text-gray-900 mb-4">Variation des prix</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-64 font-semibold cursor-pointer hover:bg-gray-100 pl-4" onClick={() => handleSort('nom')}>
                  <div className="flex items-center gap-2">
                    Matières premières
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('unite')}>
                  <div className="flex items-center gap-2">
                    Unité
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unité de mesure du prix</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('prixActuel')}>
                  <div className="flex items-center gap-2">
                    Prix actuel
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Prix actuel de la matière première</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('variationSemaine')}>
                  <div className="flex items-center gap-2">
                    Dernière semaine
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variation du prix sur la dernière semaine</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('variationMois')}>
                  <div className="flex items-center gap-2">
                    Dernier mois
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variation du prix sur le dernier mois</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('variationTrimestre')}>
                  <div className="flex items-center gap-2">
                    Dernier trimestre
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variation du prix sur le dernier trimestre</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('variationAnnee')}>
                  <div className="flex items-center gap-2">
                    Dernière année
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variation du prix sur la dernière année</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('variationPeriode')}>
                  <div className="flex items-center gap-2">
                    Sur la période
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-[#121212]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variation du prix sur la période sélectionnée</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ChevronsUpDown className="h-4 w-4 cursor-pointer text-[#121212]" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMatieres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">Aucune matière première sélectionnée</TableCell>
                </TableRow>
              ) : (
                getSortedMatieres().map((matiere) => (
                  <TableRow key={matiere.id} className="hover:bg-gray-50">
                    <TableCell className="pl-4">
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
        <div className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-medium text-gray-900">Evolution du cours par année</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="base100-annuel">Base 100</Label>
                <Switch id="base100-annuel" checked={base100Annuel} onCheckedChange={setBase100Annuel} />
              </div>
              <Select value={matiereSelectionneeAnnuelle} onValueChange={setMatiereSelectionneeAnnuelle}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedMatieres.map((matiere) => (
                    <SelectItem key={matiere.code} value={matiere.code} className="py-3">
                      {matiere.code} - {matiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="p-0">
                <Download className="text-[#0970E6]" width={24} height={24} />
              </Button>
            </div>
          </div>

          {/* Légendes années centrées avec bouton unselect à droite */}
          <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {years.map((item) => (
              <div
                key={item.year}
                className="flex items-center gap-2 cursor-pointer"
                style={{ opacity: legendOpacityAnnual[item.year] === false ? 0.4 : 1 }}
                onClick={() => toggleYear(item.year)}
              >
                <CurveIcon color={item.color} className="w-[30px] h-[14px]" />
                <span className="text-sm select-none">{item.year}</span>
              </div>
            ))}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2" onClick={unselectAllYears}>
                  <RotateCcw className="w-4 h-4 text-[#0970E6]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tout désélectionner</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Graphique annuel */}
        <div className="overflow-hidden">
        <ResponsiveContainer width="100%" height={400} style={{ paddingBottom: '20px' }}>
          <LineChart data={base100Annuel ? annualData.map((item, index) => {
            if (index === 0) return item;
            const newItem: any = { mois: item.mois };
            years.forEach((y) => {
              const year = y.year;
              const firstValue = annualData[0][year as keyof typeof annualData[0]];
              const currentValue = item[year as keyof typeof item];
              if (firstValue && currentValue && typeof firstValue === 'number' && typeof currentValue === 'number') {
                newItem[year] = (currentValue / firstValue) * 100;
              } else {
                newItem[year] = currentValue;
              }
            });
            return newItem;
          }) : annualData} margin={{ left: -30, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            {years.map((item) => (
              <Line
                key={item.year}
                type="monotone"
                dataKey={item.year}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                hide={legendOpacityAnnual[item.year] === false}
              />
            ))}
            <Brush dataKey="mois" height={30} stroke="#0970E6" fill="#FFFFFF" />
          </LineChart>
        </ResponsiveContainer>
        </div>
        </div>
      </div>
    </main>
  );
}
