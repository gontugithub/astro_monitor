import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import PageTransition from '../components/PageTransition';

// @ai-assisted — Three.js sky dome setup, LST rotation, constellation fly-to with matrixWorld

// Catálogo extendido ~120 estrellas brillantes (Hipparcos)
const STARS = [
  { name: 'Sirius',         ra: 101.287, dec: -16.716, mag: -1.46 },
  { name: 'Canopus',        ra: 95.988,  dec: -52.696, mag: -0.74 },
  { name: 'Arcturus',       ra: 213.915, dec: 19.182,  mag: -0.05 },
  { name: 'Vega',           ra: 279.235, dec: 38.784,  mag: 0.03  },
  { name: 'Capella',        ra: 79.172,  dec: 45.998,  mag: 0.08  },
  { name: 'Rigel',          ra: 78.634,  dec: -8.202,  mag: 0.13  },
  { name: 'Procyon',        ra: 114.825, dec: 5.225,   mag: 0.34  },
  { name: 'Betelgeuse',     ra: 88.793,  dec: 7.407,   mag: 0.50  },
  { name: 'Altair',         ra: 297.696, dec: 8.868,   mag: 0.77  },
  { name: 'Aldebaran',      ra: 68.980,  dec: 16.509,  mag: 0.85  },
  { name: 'Antares',        ra: 247.352, dec: -26.432, mag: 1.09  },
  { name: 'Spica',          ra: 201.298, dec: -11.161, mag: 1.04  },
  { name: 'Pollux',         ra: 116.329, dec: 28.026,  mag: 1.14  },
  { name: 'Fomalhaut',      ra: 344.413, dec: -29.622, mag: 1.16  },
  { name: 'Deneb',          ra: 310.358, dec: 45.280,  mag: 1.25  },
  { name: 'Mimosa',         ra: 191.930, dec: -59.689, mag: 1.25  },
  { name: 'Regulus',        ra: 152.093, dec: 11.967,  mag: 1.35  },
  { name: 'Adhara',         ra: 104.656, dec: -28.972, mag: 1.50  },
  { name: 'Castor',         ra: 113.650, dec: 31.888,  mag: 1.58  },
  { name: 'Shaula',         ra: 263.402, dec: -37.103, mag: 1.63  },
  { name: 'Bellatrix',      ra: 81.283,  dec: 6.350,   mag: 1.64  },
  { name: 'Elnath',         ra: 81.573,  dec: 28.608,  mag: 1.65  },
  { name: 'Alnilam',        ra: 84.053,  dec: -1.202,  mag: 1.70  },
  { name: 'Alnitak',        ra: 85.190,  dec: -1.943,  mag: 1.77  },
  { name: 'Mintaka',        ra: 83.002,  dec: -0.299,  mag: 2.23  },
  { name: 'Dubhe',          ra: 165.932, dec: 61.751,  mag: 1.79  },
  { name: 'Mirfak',         ra: 51.081,  dec: 49.861,  mag: 1.79  },
  { name: 'Alkaid',         ra: 206.885, dec: 49.313,  mag: 1.86  },
  { name: 'Sargas',         ra: 264.330, dec: -42.998, mag: 1.87  },
  { name: 'Menkent',        ra: 211.671, dec: -36.370, mag: 2.06  },
  { name: 'Atria',          ra: 247.353, dec: -68.679, mag: 1.91  },
  { name: 'Alhena',         ra: 99.428,  dec: 16.399,  mag: 1.93  },
  { name: 'Peacock',        ra: 306.412, dec: -56.735, mag: 1.94  },
  { name: 'Mirzam',         ra: 95.675,  dec: -17.956, mag: 1.98  },
  { name: 'Alphard',        ra: 141.897, dec: -8.658,  mag: 1.99  },
  { name: 'Polaris',        ra: 37.953,  dec: 89.264,  mag: 1.97  },
  { name: 'Hamal',          ra: 31.793,  dec: 23.463,  mag: 2.00  },
  { name: 'Diphda',         ra: 10.897,  dec: -17.987, mag: 2.04  },
  { name: 'Mizar',          ra: 200.981, dec: 54.925,  mag: 2.23  },
  { name: 'Nunki',          ra: 283.816, dec: -26.297, mag: 2.05  },
  { name: 'Kaus Australis', ra: 276.043, dec: -34.385, mag: 1.85  },
  { name: 'Avior',          ra: 125.628, dec: -59.510, mag: 1.86  },
  { name: 'Alkaid',         ra: 206.885, dec: 49.313,  mag: 1.86  },
  { name: 'Merak',          ra: 165.460, dec: 56.382,  mag: 2.37  },
  { name: 'Phecda',         ra: 178.458, dec: 53.695,  mag: 2.44  },
  { name: 'Megrez',         ra: 183.857, dec: 57.033,  mag: 3.31  },
  { name: 'Alioth',         ra: 193.507, dec: 55.960,  mag: 1.77  },
  { name: 'Schedar',        ra: 10.127,  dec: 56.537,  mag: 2.24  },
  { name: 'Caph',           ra: 2.295,   dec: 59.150,  mag: 2.28  },
  { name: 'Gamma Cas',      ra: 14.177,  dec: 60.717,  mag: 2.47  },
  { name: 'Ruchbah',        ra: 21.454,  dec: 60.235,  mag: 2.68  },
  { name: 'Segin',          ra: 28.599,  dec: 63.670,  mag: 3.38  },
  { name: 'Kochab',         ra: 222.676, dec: 74.156,  mag: 2.08  },
  { name: 'Pherkad',        ra: 230.182, dec: 71.834,  mag: 3.05  },
  { name: 'Acrux',          ra: 186.650, dec: -63.099, mag: 0.77  },
  { name: 'Gacrux',         ra: 187.792, dec: -57.113, mag: 1.59  },
  { name: 'Delta Cru',      ra: 183.786, dec: -58.749, mag: 2.79  },
  { name: 'Epsilon Cru',    ra: 185.340, dec: -60.401, mag: 3.59  },
  { name: 'Rasalgethi',     ra: 258.662, dec: 14.390,  mag: 2.78  },
  { name: 'Sabik',          ra: 257.595, dec: -15.725, mag: 2.43  },
  { name: 'Rasalhague',     ra: 263.734, dec: 12.560,  mag: 2.08  },
  { name: 'Algieba',        ra: 154.993, dec: 19.841,  mag: 2.08  },
  { name: 'Zosma',          ra: 168.527, dec: 20.524,  mag: 2.56  },
  { name: 'Denebola',       ra: 177.265, dec: 14.572,  mag: 2.14  },
  { name: 'Algenib',        ra: 3.309,   dec: 15.184,  mag: 2.83  },
  { name: 'Alpheratz',      ra: 2.097,   dec: 29.091,  mag: 2.07  },
  { name: 'Scheat',         ra: 345.944, dec: 28.083,  mag: 2.44  },
  { name: 'Markab',         ra: 346.190, dec: 15.212,  mag: 2.49  },
  { name: 'Enif',           ra: 326.046, dec: 9.875,   mag: 2.38  },
  { name: 'Sadalsuud',      ra: 322.890, dec: -5.571,  mag: 2.90  },
  { name: 'Sadalmelik',     ra: 331.446, dec: -0.320,  mag: 2.95  },
  { name: 'Naos',           ra: 120.896, dec: -40.003, mag: 2.25  },
  { name: 'Aludra',         ra: 111.024, dec: -29.303, mag: 2.45  },
  { name: 'Wezen',          ra: 107.098, dec: -26.393, mag: 1.84  },
  { name: 'Propus',         ra: 93.719,  dec: 22.506,  mag: 3.28  },
  { name: 'Mebsuda',        ra: 100.983, dec: 25.131,  mag: 3.06  },
  { name: 'Tejat',          ra: 95.740,  dec: 22.514,  mag: 2.87  },
  { name: 'Alhena2',        ra: 99.428,  dec: 16.399,  mag: 1.93  },
  { name: 'Wasat',          ra: 110.029, dec: 21.982,  mag: 3.53  },
  { name: 'Kaus Media',     ra: 275.249, dec: -29.828, mag: 2.70  },
  { name: 'Kaus Borealis',  ra: 276.993, dec: -25.422, mag: 2.81  },
  { name: 'Arkab',          ra: 290.972, dec: -44.460, mag: 3.97  },
  { name: 'Rukbat',         ra: 290.418, dec: -40.616, mag: 3.96  },
  { name: 'Achernar',       ra: 24.429,  dec: -57.237, mag: 0.46  },
  { name: 'Izar',           ra: 221.247, dec: 27.074,  mag: 2.35  },
  { name: 'Muphrid',        ra: 208.671, dec: 18.398,  mag: 2.68  },
  { name: 'Seginus',        ra: 218.019, dec: 38.308,  mag: 3.03  },
  { name: 'Nekkar',         ra: 225.486, dec: 40.390,  mag: 3.49  },
  { name: 'Alphecca',       ra: 233.672, dec: 26.715,  mag: 2.23  },
  { name: 'Nusakan',        ra: 237.819, dec: 29.106,  mag: 3.66  },
  { name: 'Zubenelgenubi',  ra: 222.719, dec: -16.042, mag: 2.75  },
  { name: 'Zubeneschamali', ra: 229.252, dec: -9.383,  mag: 2.61  },
  { name: 'Graffias',       ra: 241.359, dec: -19.806, mag: 2.62  },
  { name: 'Dschubba',       ra: 240.083, dec: -22.622, mag: 2.32  },
  { name: 'Pi Sco',         ra: 239.713, dec: -26.114, mag: 2.89  },
  { name: 'Eta Sco',        ra: 258.038, dec: -43.239, mag: 3.33  },
  { name: 'Lesath',         ra: 264.330, dec: -37.296, mag: 2.70  },
  { name: 'Girtab',         ra: 265.622, dec: -39.030, mag: 2.41  },
];

// Constelaciones completas con líneas
const CONSTELLATIONS = {
  'Orión': {
    center: { ra: 84, dec: 2 },
    lines: [
      ['Betelgeuse','Bellatrix'],['Betelgeuse','Alnilam'],
      ['Bellatrix','Alnilam'],['Alnilam','Alnitak'],
      ['Alnilam','Mintaka'],['Alnitak','Rigel'],
      ['Mintaka','Rigel'],['Rigel','Wezen'],
      ['Bellatrix','Elnath'],
    ],
  },
  'Osa Mayor': {
    center: { ra: 193, dec: 56 },
    lines: [
      ['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],
      ['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],
      ['Megrez','Dubhe'],
    ],
  },
  'Osa Menor': {
    center: { ra: 230, dec: 77 },
    lines: [
      ['Polaris','Kochab'],['Kochab','Pherkad'],
    ],
  },
  'Casiopea': {
    center: { ra: 14, dec: 60 },
    lines: [
      ['Schedar','Caph'],['Caph','Gamma Cas'],
      ['Gamma Cas','Ruchbah'],['Ruchbah','Segin'],
    ],
  },
  'Cruz del Sur': {
    center: { ra: 187, dec: -60 },
    lines: [
      ['Acrux','Gacrux'],['Mimosa','Delta Cru'],
    ],
  },
  'Escorpio': {
    center: { ra: 252, dec: -26 },
    lines: [
      ['Graffias','Dschubba'],['Dschubba','Antares'],
      ['Antares','Sabik'],['Sabik','Shaula'],
      ['Shaula','Lesath'],['Lesath','Sargas'],
      ['Sargas','Girtab'],
    ],
  },
  'Sagitario': {
    center: { ra: 276, dec: -30 },
    lines: [
      ['Kaus Australis','Kaus Media'],['Kaus Media','Kaus Borealis'],
      ['Kaus Borealis','Nunki'],['Nunki','Kaus Australis'],
    ],
  },
  'Leo': {
    center: { ra: 160, dec: 15 },
    lines: [
      ['Regulus','Algieba'],['Algieba','Zosma'],
      ['Zosma','Denebola'],['Regulus','Denebola'],
    ],
  },
  'Géminis': {
    center: { ra: 112, dec: 28 },
    lines: [
      ['Castor','Pollux'],['Castor','Tejat'],
      ['Pollux','Wasat'],['Tejat','Alnilam'],
    ],
  },
  'Tauro': {
    center: { ra: 70, dec: 18 },
    lines: [
      ['Aldebaran','Elnath'],['Aldebaran','Hamal'],
    ],
  },
  'Cygnus': {
    center: { ra: 310, dec: 45 },
    lines: [
      ['Deneb','Altair'],['Deneb','Vega'],
    ],
  },
  'Corona Boreal': {
    center: { ra: 233, dec: 28 },
    lines: [
      ['Alphecca','Nusakan'],['Alphecca','Izar'],
    ],
  },
};

function raDecToXYZ(ra, dec, r = 50) {
  const raR = (ra * Math.PI) / 180;
  const decR = (dec * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.cos(decR) * Math.cos(raR),
     r * Math.sin(decR),
     r * Math.cos(decR) * Math.sin(raR)
  );
}

function getLST(lon) {
  const now = new Date();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  return ((h * 15 + lon + 180) % 360 * Math.PI) / 180;
}

const FALLBACK_CITIES = [
  { name: 'Madrid',    lat: 40.42, lon: -3.70  },
  { name: 'Barcelona', lat: 41.38, lon: 2.17   },
  { name: 'London',    lat: 51.51, lon: -0.13  },
  { name: 'New York',  lat: 40.71, lon: -74.01 },
  { name: 'Tokyo',     lat: 35.68, lon: 139.69 },
  { name: 'Sydney',    lat: -33.87, lon: 151.21 },
];

export default function Stellarium() {
  const mountRef   = useRef(null);
  const camRef     = useRef(null);
  const skyRef = useRef(null);
  const rendererRef = useRef(null);
  const [location, setLocation]             = useState(null);
  const [locationError, setLocationError]   = useState(false);
  const [manualCity, setManualCity]         = useState(null);
  const [selectedStar, setSelectedStar]     = useState(null);
  const [showConstellations, setShowConstellations] = useState(true);
  const [magnitudeLimit, setMagnitudeLimit] = useState(3.5);
  const [activeConst, setActiveConst]       = useState(null);
  const [constLabels, setConstLabels] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lon: p.coords.longitude }),
      ()  => setLocationError(true)
    );
  }, []);

  const activeLocation = manualCity || location;

  // Volar a constelación
  const flyToConstellation = useCallback((name) => {
        const c = CONSTELLATIONS[name];
        if (!c || !camRef.current || !skyRef.current) return;
        setActiveConst(name);

        // Convertir centro de constelación a coordenadas mundo
        const worldPos = raDecToXYZ(c.center.ra, c.center.dec, 50);
        skyRef.current.updateMatrixWorld();
        worldPos.applyMatrix4(skyRef.current.matrixWorld);

        // Calcular ángulos de cámara para apuntar a ese punto
        const targetY = Math.atan2(-worldPos.x, -worldPos.z);
        const dist    = Math.sqrt(worldPos.x ** 2 + worldPos.z ** 2);
        const targetX = -Math.atan2(worldPos.y, dist);

        const cam    = camRef.current;
        const startY = cam.rotation.y;
        const startX = cam.rotation.x;

        let t = 0;
        const dur = 80;
        const fly = () => {
            t++;
            const ease = 1 - Math.pow(1 - t / dur, 3);
            cam.rotation.y = startY + (targetY - startY) * ease;
            cam.rotation.x = startX + (targetX - startX) * ease;
            if (t < dur) requestAnimationFrame(fly);
        };
        fly();
    }, []);

  useEffect(() => {
    if (!activeLocation || !mountRef.current) return;
    const mount = mountRef.current;
    const { lat, lon } = activeLocation;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(80, w / h, 0.01, 1000);
    camRef.current = camera;
    camera.position.set(0, 0, 0.01);
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Sky group — rotado por LST y latitud
    const sky = new THREE.Group();
    skyRef.current = sky;
    sky.rotation.y = getLST(lon);
    sky.rotation.z = -(lat * Math.PI) / 180;
    scene.add(sky);

    const visible = STARS.filter((s) => s.mag <= magnitudeLimit);

    // Estrellas normales
    const pos = [], col = [];
    const c = new THREE.Color();
    visible.forEach((s) => {
      const v = raDecToXYZ(s.ra, s.dec);
      pos.push(v.x, v.y, v.z);
      // Color: azulado para calientes, anaranjado para frías
      const t = Math.max(0, Math.min(1, (s.mag + 1.5) / 4));
      c.setHSL(0.6 - t * 0.15, 0.3, 0.85 + t * 0.15);
      col.push(c.r, c.g, c.b);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
    sky.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 2.2, vertexColors: true, sizeAttenuation: false,
      transparent: true, opacity: 0.92,
    })));

    // Estrellas brillantes (mag < 1.5) — más grandes
    const bpos = [];
    visible.filter((s) => s.mag < 1.5).forEach((s) => {
      const v = raDecToXYZ(s.ra, s.dec);
      bpos.push(v.x, v.y, v.z);
    });
    if (bpos.length) {
      const bgeo = new THREE.BufferGeometry();
      bgeo.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3));
      sky.add(new THREE.Points(bgeo, new THREE.PointsMaterial({
        size: 5, color: 0xffffff, sizeAttenuation: false,
        transparent: true, opacity: 1,
      })));
    }

    // Vía Láctea — banda densa de partículas
    const mwPos = [];
    for (let i = 0; i < 8000; i++) {
      const ra  = Math.random() * 360;
      const dec = (Math.random() - 0.5) * 20 + Math.sin((ra * Math.PI) / 180) * 5;
      const r   = 48 + Math.random() * 2;
      const v   = raDecToXYZ(ra, dec, r);
      mwPos.push(v.x, v.y, v.z);
    }
    const mwGeo = new THREE.BufferGeometry();
    mwGeo.setAttribute('position', new THREE.Float32BufferAttribute(mwPos, 3));
    sky.add(new THREE.Points(mwGeo, new THREE.PointsMaterial({
      size: 0.6, color: 0xaabbff, sizeAttenuation: false,
      transparent: true, opacity: 0.18,
    })));

    // Estrellas de fondo (universo profundo)
    const bgPos = [];
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 80;
      bgPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPos, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: 0.5, color: 0xffffff, sizeAttenuation: false,
      transparent: true, opacity: 0.25,
    })));

    // Líneas de constelaciones
    if (showConstellations) {
      const mat = new THREE.LineBasicMaterial({ color: 0x50ffb0, transparent: true, opacity: 0.5 });
      Object.values(CONSTELLATIONS).forEach(({ lines }) => {
        lines.forEach(([a, b]) => {
          const sa = STARS.find((s) => s.name === a);
          const sb = STARS.find((s) => s.name === b);
          if (!sa || !sb) return;
          const geo = new THREE.BufferGeometry().setFromPoints([
            raDecToXYZ(sa.ra, sa.dec, 49.5),
            raDecToXYZ(sb.ra, sb.dec, 49.5),
          ]);
          sky.add(new THREE.Line(geo, mat));
        });
      });
    }

    // Mouse drag
    let drag = false, prev = { x: 0, y: 0 }, rotX = 0, rotY = 0;
    const down  = (e) => { drag = true; prev = { x: e.clientX, y: e.clientY }; };
    const up    = () => { drag = false; };
    const move  = (e) => {
      if (!drag) return;
      rotY += (e.clientX - prev.x) * 0.003;
      rotX += (e.clientY - prev.y) * 0.003;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      camera.rotation.y = -rotY;
      camera.rotation.x = -rotX;
      prev = { x: e.clientX, y: e.clientY };
    };
    const tdown = (e) => { drag = true; prev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const tmove = (e) => {
      if (!drag) return;
      rotY += (e.touches[0].clientX - prev.x) * 0.003;
      rotX += (e.touches[0].clientY - prev.y) * 0.003;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      camera.rotation.y = -rotY;
      camera.rotation.x = -rotX;
      prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    mount.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    mount.addEventListener('touchstart', tdown);
    mount.addEventListener('touchmove', tmove);
    mount.addEventListener('touchend', up);

    // Scroll zoom
    const onWheel = (e) => {
      camera.fov = Math.max(20, Math.min(100, camera.fov + e.deltaY * 0.05));
      camera.updateProjectionMatrix();
    };
    mount.addEventListener('wheel', onWheel);

    let id;
    rendererRef.current = renderer;
    const animate = () => {
        id = requestAnimationFrame(animate);
        renderer.render(scene, camera);

        // Proyectar centros de constelaciones a pantalla
        const labels = [];
        Object.entries(CONSTELLATIONS).forEach(([name, { center }]) => {
            const worldPos = raDecToXYZ(center.ra, center.dec, 50).clone();
            sky.updateMatrixWorld();
            worldPos.applyMatrix4(sky.matrixWorld);

            const projected = worldPos.clone().project(camera);
            if (projected.z > 1) return; // detrás de la cámara

            const x = (projected.x *  0.5 + 0.5) * mount.clientWidth;
            const y = (projected.y * -0.5 + 0.5) * mount.clientHeight;

            if (x < 0 || x > mount.clientWidth || y < 0 || y > mount.clientHeight) return;
            labels.push({ name, x, y });
        });
        setConstLabels(labels);
    };
    animate();

    const onResize = () => {
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(id);
      mount.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
      mount.removeEventListener('touchstart', tdown);
      mount.removeEventListener('touchmove', tmove);
      mount.removeEventListener('touchend', up);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeLocation, showConstellations, magnitudeLimit]);

  const visibleCount = STARS.filter((s) => s.mag <= magnitudeLimit).length;

  return (
    <PageTransition>
      <div className="relative w-full h-[calc(100vh-6rem)] rounded-xl overflow-hidden">

        {/* Canvas */}
        <div
          ref={mountRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(30,20,80,0.8) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(10,30,80,0.6) 0%, transparent 50%),
              linear-gradient(to bottom, #05050f 0%, #080818 60%, #0a0a20 100%)
            `,
          }}
        />

        {/* Pedir ubicación */}
        {locationError && !manualCity && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="glass-panel p-8 rounded-xl max-w-sm w-full mx-4 text-center space-y-4">
              <span className="material-symbols-outlined text-aurora text-4xl">location_off</span>
              <h2 className="text-on-surface font-semibold">Location access denied</h2>
              <p className="text-on-surface-variant text-sm">Select a city to observe the sky from:</p>
              <div className="space-y-2">
                {FALLBACK_CITIES.map((c) => (
                  <button key={c.name} onClick={() => setManualCity(c)}
                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-aurora/10 hover:text-aurora border border-transparent hover:border-aurora/30 text-sm font-mono transition-all">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {!activeLocation && !locationError && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="glass-panel p-8 rounded-xl text-center space-y-3">
              <span className="material-symbols-outlined text-aurora text-4xl animate-pulse">my_location</span>
              <p className="text-on-surface-variant text-sm font-mono tracking-widest">ACQUIRING LOCATION…</p>
            </div>
          </div>
        )}

        {activeLocation && (<>

          {/* HUD izquierdo — Star info + Observer */}
          <div className="absolute left-6 top-6 z-20 w-72 space-y-4 pointer-events-auto">
            <section className="glass-panel p-5 rounded-xl border-l-2 border-aurora">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-on-surface font-semibold uppercase tracking-tight text-sm">Object Target</h2>
                  <p className="text-aurora font-mono text-xs mt-1" style={{ textShadow: '0 0 10px rgba(80,255,176,0.5)' }}>
                    {selectedStar?.name ?? 'DRAG TO EXPLORE'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-aurora text-xl">target</span>
              </div>
              {selectedStar ? (
                <div className="space-y-2 font-mono text-[11px]">
                  {[
                    ['MAGNITUDE',   selectedStar.mag.toFixed(2)],
                    ['ASCENSION',   `${(selectedStar.ra / 15).toFixed(2)}h`],
                    ['DECLINATION', `${selectedStar.dec.toFixed(2)}°`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-on-surface-variant">{k}</span>
                      <span className="text-aurora">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Drag to rotate the sky dome. Scroll to zoom. Use the constellation panel to navigate.
                </p>
              )}
            </section>

            <section className="glass-panel p-5 rounded-xl">
              <h3 className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-aurora inline-block"></span>
                Observer
              </h3>
              <div className="font-mono text-[11px] space-y-1.5">
                {[
                  ['LAT', `${activeLocation.lat.toFixed(3)}°`],
                  ['LON', `${activeLocation.lon.toFixed(3)}°`],
                  ['UTC', new Date().toUTCString().slice(17, 25)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-on-surface-variant">{k}</span>
                    <span className="text-aurora">{v}</span>
                  </div>
                ))}
              </div>
              {manualCity && (
                <button onClick={() => { setManualCity(null); setLocationError(false); navigator.geolocation.getCurrentPosition((p) => setLocation({ lat: p.coords.latitude, lon: p.coords.longitude }), () => setLocationError(true)); }}
                  className="mt-3 text-[10px] font-mono text-aurora/60 hover:text-aurora transition-colors">
                  ↺ Use real location
                </button>
              )}
            </section>
          </div>

          {/* HUD derecho — Filtros + Constelaciones */}
          <div className="absolute right-6 top-6 z-20 w-64 space-y-4 pointer-events-auto">
            <div className="glass-panel p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">filter_list</span>
                <span className="text-[11px] font-semibold uppercase tracking-widest">Filters</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Constellations</span>
                <button onClick={() => setShowConstellations((v) => !v)}
                  className={`w-10 h-5 rounded-full relative transition-all ${showConstellations ? 'bg-aurora/20 border border-aurora/30' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${showConstellations ? 'right-1 bg-aurora' : 'left-1 bg-on-surface-variant'}`} />
                </button>
              </div>
              <div className="space-y-1.5 pt-3 border-t border-white/10">
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>MAGNITUDE LIMIT</span>
                  <span className="text-aurora">{magnitudeLimit.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="4" step="0.5" value={magnitudeLimit}
                  onChange={(e) => setMagnitudeLimit(parseFloat(e.target.value))}
                  className="w-full accent-aurora" />
              </div>
            </div>

            {/* Selector de constelaciones */}
            <div className="glass-panel p-4 rounded-xl space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2">
                Navigate to constellation
              </span>
              {Object.keys(CONSTELLATIONS).map((name) => (
                <button key={name} onClick={() => flyToConstellation(name)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono text-left transition-all ${
                    activeConst === name
                      ? 'bg-aurora/10 text-aurora border border-aurora/30'
                      : 'bg-white/5 hover:bg-white/10 text-on-surface-variant border border-transparent'
                  }`}>
                  {name}
                </button>
              ))}
            </div>

            {/* Ciudad manual */}
            <div className="glass-panel p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Change city</span>
              <div className="space-y-1">
                {FALLBACK_CITIES.map((c) => (
                  <button key={c.name} onClick={() => setManualCity(c)}
                    className={`w-full p-2 rounded-lg text-xs font-mono text-left transition-all ${
                      manualCity?.name === c.name
                        ? 'bg-aurora/10 text-aurora border border-aurora/30'
                        : 'bg-white/5 hover:bg-white/10 text-on-surface-variant border border-transparent'
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Labels de constelaciones sobre el canvas */}
            {showConstellations && constLabels.map(({ name, x, y }) => (
                <div
                    key={name}
                    className="absolute z-10 pointer-events-none"
                    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full border ${
                        activeConst === name
                        ? 'bg-aurora border-aurora shadow-[0_0_8px_#50FFB0]'
                        : 'bg-aurora/40 border-aurora/60'
                    }`} />
                    <span className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${
                        activeConst === name ? 'text-aurora' : 'text-aurora/60'
                    }`}
                        style={{ textShadow: '0 0 6px rgba(0,0,0,0.8)' }}>
                        {name}
                    </span>
                    </div>
                </div>
            ))}

          {/* Footer HUD */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-6 font-mono text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-aurora animate-pulse inline-block"></span>
                LIVE SKY
              </span>
              <span>DRAG · ROTATE</span>
              <span>SCROLL · ZOOM</span>
              <span className="text-aurora">{visibleCount} STARS</span>
            </div>
          </div>

        </>)}
      </div>
    </PageTransition>
  );
}