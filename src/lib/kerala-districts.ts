export interface KeralaDistrict {
  id: string;
  name: string;
}

export const KERALA_DISTRICTS: KeralaDistrict[] = [
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram' },
  { id: 'kollam', name: 'Kollam' },
  { id: 'pathanamthitta', name: 'Pathanamthitta' },
  { id: 'alappuzha', name: 'Alappuzha' },
  { id: 'kottayam', name: 'Kottayam' },
  { id: 'idukki', name: 'Idukki' },
  { id: 'ernakulam', name: 'Ernakulam' },
  { id: 'thrissur', name: 'Thrissur' },
  { id: 'palakkad', name: 'Palakkad' },
  { id: 'malappuram', name: 'Malappuram' },
  { id: 'kozhikode', name: 'Kozhikode' },
  { id: 'wayanad', name: 'Wayanad' },
  { id: 'kannur', name: 'Kannur' },
  { id: 'kasaragod', name: 'Kasaragod' },
];

const districtMap = new Map(KERALA_DISTRICTS.map((d) => [d.id, d.name]));

export function districtLabel(id: string | null | undefined): string {
  if (!id) return '—';
  return districtMap.get(id) ?? id;
}

export function matchesDistricts(
  selected: string[],
  entityDistrict: string | null | undefined,
): boolean {
  if (selected.length === 0) return true;
  if (!entityDistrict) return false;
  return selected.includes(entityDistrict);
}

/** Map common Kerala city names to district ids for mock enrichment. */
export function districtFromCity(city: string): string {
  const c = city.trim().toLowerCase();
  if (c.includes('kochi') || c.includes('aluva') || c.includes('ernakulam')) {
    return 'ernakulam';
  }
  if (c.includes('thrissur')) return 'thrissur';
  if (
    c.includes('trivandrum') ||
    c.includes('thiruvananthapuram') ||
    c.includes('tvm')
  ) {
    return 'thiruvananthapuram';
  }
  if (c.includes('kozhikode') || c.includes('calicut')) return 'kozhikode';
  if (c.includes('kollam')) return 'kollam';
  if (c.includes('kottayam')) return 'kottayam';
  if (c.includes('palakkad')) return 'palakkad';
  if (c.includes('malappuram')) return 'malappuram';
  if (c.includes('kannur')) return 'kannur';
  if (c.includes('kasaragod')) return 'kasaragod';
  if (c.includes('alappuzha') || c.includes('alleppey')) return 'alappuzha';
  if (c.includes('pathanamthitta')) return 'pathanamthitta';
  if (c.includes('idukki')) return 'idukki';
  if (c.includes('wayanad')) return 'wayanad';
  return 'ernakulam';
}
