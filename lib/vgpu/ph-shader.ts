/**
 * Philippine 3D Halftone Dot Matrix WGSL Shader
 * Renders an interactive, GPU-accelerated Philippine archipelago dot matrix in 3D isometric space.
 */

export const PH_HALFTONE_WGSL = `
struct Params {
  time: f32,
  resolution: vec2f,
  mouse: vec2f,
  mouse_speed: f32,
  click_time: f32,
  click_pos: vec2f,
  pulse_intensity: f32,
  intensity: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var mask_texture: texture_2d<f32>;
@group(0) @binding(2) var mask_sampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / max(params.resolution.y, 1.0);
  
  // Coordinate transformations
  let aspect_uv = vec2f((uv.x - 0.5) * aspect + 0.5, uv.y);
  let aspect_mouse = vec2f((params.mouse.x - 0.5) * aspect + 0.5, params.mouse.y);
  let aspect_click = vec2f((params.click_pos.x - 0.5) * aspect + 0.5, params.click_pos.y);

  let mouse_dist = length(aspect_uv - aspect_mouse);
  let t = params.time;

  // Expanding shockwaves across the Philippine archipelago
  var shockwave: f32 = 0.0;
  if (params.click_time < 3.5) {
    let wave_radius = params.click_time * 0.75;
    let dist_to_click = length(aspect_uv - aspect_click);
    let wave_front = abs(dist_to_click - wave_radius);
    let wave_decay = exp(-params.click_time * 1.1) * params.pulse_intensity;
    let ring = exp(-wave_front * 45.0) * wave_decay;
    let ring2 = exp(-abs(dist_to_click - wave_radius * 0.5) * 30.0) * wave_decay * 0.35;
    shockwave = (ring + ring2) * (sin(dist_to_click * 40.0 - t * 8.0) * 0.5 + 0.5);
  }

  // Interactive mouse proximity wave ripple
  let cursor_ripple = sin(mouse_dist * 26.0 - t * 3.5) * exp(-mouse_dist * 3.5) * (0.12 + params.mouse_speed * 0.25);

  // Halftone Grid: High Density
  let grid_size = 90.0;
  let cell_uv = uv * grid_size;
  let cell_id = floor(cell_uv);
  let cell_center_uv = (cell_id + vec2f(0.5, 0.5)) / grid_size;
  let local_uv = fract(cell_uv) - vec2f(0.5, 0.5);
  let dist_to_dot_center = length(local_uv);

  // Sample Philippine mask at the dot center
  let mask_sample = textureSampleLevel(mask_texture, mask_sampler, cell_center_uv, 0.0);
  let is_land = mask_sample.r;

  // Distance from cursor to this dot cell
  let aspect_cell_center = vec2f((cell_center_uv.x - 0.5) * aspect + 0.5, cell_center_uv.y);
  let dot_mouse_dist = length(aspect_cell_center - aspect_mouse);
  let dot_mouse_glow = exp(-dot_mouse_dist * 3.2);

  // Obsidian card background
  var color = vec3f(0.025, 0.028, 0.033);

  // Subtle ambient background coordinate grid dots
  let bg_dot_radius = 0.055;
  let bg_dot = 1.0 - smoothstep(bg_dot_radius - 0.02, bg_dot_radius + 0.02, dist_to_dot_center);
  color += vec3f(0.14, 0.18, 0.24) * (bg_dot * 0.3 * (1.0 + dot_mouse_glow * 0.6));

  // Philippine Land Halftone Dots
  if (is_land > 0.08) {
    var radius = 0.33 * is_land;
    radius += dot_mouse_glow * 0.12;
    radius += cursor_ripple * 0.07;
    radius += shockwave * 0.15;
    radius = clamp(radius, 0.08, 0.47);

    // Crisp antialiased circle
    let dot_alpha = 1.0 - smoothstep(radius - 0.03, radius + 0.03, dist_to_dot_center);

    // Bryl-minimal crisp slate-white dots
    var dot_color = vec3f(0.88, 0.90, 0.94);
    
    // Interactive mouse hover glow (soft luminescence)
    dot_color += vec3f(0.18, 0.42, 0.65) * (dot_mouse_glow * 0.85);
    
    // Shockwave pulse illumination
    dot_color += vec3f(0.25, 0.60, 0.95) * (shockwave * 1.5);

    // Subtle gentle wave modulation
    let wave_pulse = sin(cell_center_uv.y * 12.0 - t * 2.0) * 0.06;
    dot_color *= (0.94 + wave_pulse);

    color += dot_color * dot_alpha;
  }

  // Soft vignette
  let vig = 1.0 - smoothstep(0.45, 0.95, length(uv - vec2f(0.5, 0.5)));
  color *= (0.75 + 0.25 * vig);

  return vec4f(color * params.intensity, 1.0);
}
`;
