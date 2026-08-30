-- Semilla del catálogo de categorías.
--
-- Idempotente: `on conflict (slug)` refresca nombre, descripción, icono, color y
-- orden, pero nunca reactiva una categoría que un administrador haya desactivado
-- a propósito (is_active se deja intacto en el update).
--
-- Los iconos son nombres de `lucide-react`, que ya es una dependencia del
-- proyecto: no se añade ninguna librería nueva para representarlos.

insert into public.incident_categories (slug, name, description, icon, color, sort_order)
values
  ('accidente',      'Accidente',        'Colisión, atropello o accidente de tránsito.',            'CarFront',      '#D9503F', 10),
  ('incendio',       'Incendio',         'Fuego activo en vivienda, comercio o vegetación.',        'Flame',         '#D64524', 20),
  ('emergencia',     'Emergencia',       'Emergencia médica o rescate en curso.',                   'Siren',         '#C7343F', 30),
  ('seguridad',      'Seguridad',        'Situación de riesgo o incidente de seguridad pública.',   'ShieldAlert',   '#B0453E', 40),
  ('corte_de_luz',   'Corte de luz',     'Interrupción del suministro eléctrico.',                  'ZapOff',        '#C9A227', 50),
  ('corte_de_agua',  'Corte de agua',    'Interrupción del suministro de agua potable.',            'DropletOff',    '#5B8DB8', 60),
  ('calle_cortada',  'Calle cortada',    'Vía cerrada por obras, derrumbe o manifestación.',        'Construction',  '#D67E33', 70),
  ('congestion',     'Congestión',       'Congestión vehicular relevante.',                         'TrafficCone',   '#D9A441', 80),
  ('transporte',     'Transporte',       'Incidencia en transporte público o servicios de movilidad.', 'Bus',        '#6FA8A0', 90),
  ('clima',          'Clima',            'Marejadas, viento, lluvia intensa u otro evento climático.', 'CloudRain',   '#2E6A94', 100),
  ('evento',         'Evento',           'Evento masivo con impacto en la vía pública.',            'CalendarDays',  '#B08CC4', 110),
  ('otro',           'Otro',             'No encaja en las categorías anteriores.',                 'CircleDashed',  '#8A8A8A', 120)
on conflict (slug) do update
set name        = excluded.name,
    description = excluded.description,
    icon        = excluded.icon,
    color       = excluded.color,
    sort_order  = excluded.sort_order;
