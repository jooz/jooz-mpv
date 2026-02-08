export type State = {
  id: string;
  name: string;
};

export type Municipality = {
  id: string;
  state_id: string;
  name: string;
};

// Static fallback data (useful for initial dev or offline)
export const VENEZUELA_STATES = [
  { name: 'Distrito Capital' },
  { name: 'Miranda' },
  { name: 'Zulia' },
  { name: 'Carabobo' },
  { name: 'Lara' },
  { name: 'Aragua' },
  { name: 'Anzoátegui' },
  { name: 'Bolívar' },
  { name: 'Falcón' },
  { name: 'Mérida' },
  { name: 'Táchira' },
  { name: 'Nueva Esparta' },
];

export const VENEZUELA_MUNICIPALITIES: Record<string, string[]> = {
  'Distrito Capital': ['Libertador'],
  'Miranda': ['Chacao', 'Baruta', 'Sucre', 'El Hatillo', 'Guaicaipuro'],
  'Zulia': ['Maracaibo', 'San Francisco', 'Cabimas'],
  'Carabobo': ['Valencia', 'Naguanagua', 'San Diego', 'Puerto Cabello'],
  // Add more as needed
};
