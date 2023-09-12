
export const displayMap= (locations)=>{

mapboxgl.accessToken = 'pk.eyJ1Ijoia3Jpc2hnYW5kaGkxODA2IiwiYSI6ImNsbTh5NzR3djBnNDkzY3I3d2k3dGFoZXEifQ.nNadW98P1_KpxsTCTQZmVg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/krishgandhi1806/clm8yjs35014e01qyfhv42jz4',
  scrollZoom: false,
  hash: true,
  zoom: false
});

const bounds= new mapboxgl.LngLatBounds();

locations.forEach(loc=>{
    // Create a marker
    const el= document.createElement('div');
    el.className='marker';

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup({
        offset: 30,
        focusAfterOpen: false
    }).setLngLat(loc.coordinates).setHTML(`<p> Day: ${loc.day}: ${loc.description}`).addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
})

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 200,
        right: 200
    }
})
};