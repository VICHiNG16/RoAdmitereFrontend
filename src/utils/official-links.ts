import { Alert, Linking } from "react-native";

import { normalizeRomanianText } from "./text";

const OFFICIAL_SITE_URL_BY_ENTITY_ID: Record<string, string> = {
  "university-universitatea-babes-bolyai": "https://www.ubbcluj.ro/",
  "university-universitatea-din-bucuresti": "https://unibuc.ro/",
  "university-universitatea-de-vest": "https://www.uvt.ro/",
  "faculty-arte-si-design": "https://www.unarte.org/",
  "faculty-drept": "https://law.ubbcluj.ro/",
  "faculty-facultatea-de-biologie": "https://biologie.unibuc.ro/",
  "faculty-facultatea-de-drept": "https://drept.uvt.ro/",
  "faculty-facultatea-de-istorie": "https://hiphi.ubbcluj.ro/",
  "faculty-facultatea-de-matematica": "https://www.math.ubbcluj.ro/",
  "faculty-facultatea-de-matematica-si-informatica": "https://www.cs.ubbcluj.ro/",
  "faculty-facultatea-de-psihologie": "https://fsp.uvt.ro/",
  "faculty-geografie": "https://geografie.ubbcluj.ro/",
  "faculty-litere": "https://lett.ubbcluj.ro/",
  "faculty-matematica-si-informatica": "https://www.cs.ubbcluj.ro/",
  "faculty-teatru-si-film": "https://teatrufilm.ubbcluj.ro/",
  "program-arhitectura-uauim": "https://www.uauim.ro/",
  "program-cibernetica-economica-ase-bucuresti": "https://csie.ase.ro/",
  "program-drept-uaic-iasi": "https://www.uaic.ro/",
  "program-drept-ubb-cluj": "https://law.ubbcluj.ro/",
  "program-informatica-economica-ubb-cluj-napoca": "https://econ.ubbcluj.ro/",
  "program-informatica-unibuc": "https://fmi.unibuc.ro/",
  "program-informatica-universitatea-babes-bolyai": "https://www.cs.ubbcluj.ro/",
  "program-informatica-uvt-timisoara": "https://info.uvt.ro/",
  "program-matematica-aplicata-universitatea-babes-bolyai": "https://www.math.ubbcluj.ro/",
  "program-matematica-universitatea-babes-bolyai": "https://www.math.ubbcluj.ro/",
  "program-psihologie-clinica-univ-din-bucuresti": "https://fpse.unibuc.ro/",
  "program-psihologie-clinica-uvt-timisoara": "https://fsp.uvt.ro/",
};

type OpenOfficialSiteParams = {
  entityId: string;
  entityLabel?: string;
  fallbackUrl?: string;
};

export function resolveOfficialSiteUrl(entityId: string, fallbackUrl?: string): string | undefined {
  return OFFICIAL_SITE_URL_BY_ENTITY_ID[entityId] ?? fallbackUrl;
}

export async function openOfficialSiteWithFeedback({
  entityId,
  entityLabel,
  fallbackUrl,
}: OpenOfficialSiteParams): Promise<void> {
  const url = resolveOfficialSiteUrl(entityId, fallbackUrl);
  const displayLabel = normalizeRomanianText(entityLabel ?? "acest profil");

  if (!url) {
    Alert.alert(
      "Site oficial indisponibil",
      normalizeRomanianText(`Nu am găsit încă link-ul oficial pentru ${displayLabel}.`)
    );
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error("URL is not openable.");
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Nu am putut deschide link-ul",
      normalizeRomanianText(`Încearcă manual acest URL: ${url}`)
    );
  }
}
