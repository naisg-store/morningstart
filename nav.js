// nav.js - Dynamic Navigation, Live Search & Wikimedia Parallax Router
document.addEventListener("DOMContentLoaded", async () => {
  const isSubpage = window.location.pathname.includes('/guides/');
  const basePath = isSubpage ? '../' : './';
  const linkPrefix = isSubpage ? '' : 'guides/';

  const cityGrid = document.getElementById('city-links-grid');
  const guideGrid = document.getElementById('guide-links-grid');

  // Wikimedia API Parallax
  async function loadCityBackground() {
    const cityEl = document.getElementById('city-name');
    if (!cityEl) return;
    
    const cityName = cityEl.textContent.trim();
    if (cityName === "Locating you…" || cityName === "Loading City..." || cityName.includes("CITY_NAME")) return;

    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(cityName)}&origin=*`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      const pages = data.query.pages;
      const page = Object.values(pages)[0];

      if (page && page.original && page.original.source) {
        const imgUrl = page.original.source;
        const parallaxBg = document.createElement('div');
        parallaxBg.style.position = 'fixed';
        parallaxBg.style.top = '0';
        parallaxBg.style.left = '0';
        parallaxBg.style.width = '100vw';
        parallaxBg.style.height = '100vh';
        parallaxBg.style.backgroundImage = `url('${imgUrl}')`;
        parallaxBg.style.backgroundSize = 'cover';
        parallaxBg.style.backgroundPosition = 'center';
        parallaxBg.style.backgroundAttachment = 'fixed';
        parallaxBg.style.opacity = '0.12'; 
        parallaxBg.style.zIndex = '-1';
        parallaxBg.style.pointerEvents = 'none';
        
        parallaxBg.animate([{ opacity: 0 }, { opacity: 0.12 }], { duration: 1500, easing: 'ease-out' });
        document.body.appendChild(parallaxBg);
      }
    } catch (error) { console.error("Failed to load Wikimedia background:", error); }
  }
  loadCityBackground();

  if (guideGrid) {
    try {
      const res = await fetch(`${basePath}guides.json`);
      const guides = await res.json();
      
      guideGrid.innerHTML = guides.map(g => `
        <a href="${linkPrefix}${g.slug}" style="background:var(--panel); border:1px solid var(--panel-border); border-radius:var(--radius-md); padding:16px; text-decoration:none; display:flex; flex-direction:column; gap:10px; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); transition:border-color 0.2s;">
          <div style="width:100%; height:110px; background:var(--bg-deep); border:1px solid var(--panel-border); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; color:var(--muted-dim); font-size:24px;">
            ${g.emoji}
          </div>
          <div>
            <span style="font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:${g.color}; font-weight:700;">${g.category}</span>
            <h3 style="margin:4px 0 6px; font-size:15px; color:var(--text); font-weight:700; line-height:1.3;">${g.title}</h3>
            <p style="margin:0; font-size:12px; color:var(--muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
              ${g.desc}
            </p>
          </div>
        </a>
      `).join('');
    } catch(e) { console.error("Failed to load guides:", e); }
  }

  if (cityGrid) {
    try {
      const res = await fetch(`${basePath}cities.json`);
      const cities = await res.json();

      const searchHTML = `
        <div style="margin-bottom:16px; position:relative;">
          <input type="text" id="citySearch" placeholder="Search by city or state (e.g., Denver, TX)..." 
            style="width:100%; padding:14px 16px 14px 40px; background:rgba(10, 17, 32, 0.6); border:1px solid var(--panel-border); border-radius:var(--radius-md); color:var(--text); font-size:15px; outline:none; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); transition:border-color 0.2s;" 
            onfocus="this.style.borderColor='var(--cyan)'" 
            onblur="this.style.borderColor='var(--panel-border)'">
          <span style="position:absolute; left:14px; top:14px; font-size:16px; opacity:0.5;">🔍</span>
        </div>
      `;
      cityGrid.insertAdjacentHTML('beforebegin', searchHTML);

      // Map states to regions so the global grid matches the template exactly
      const regionMap = {
        'CA':'West Coast & Pacific', 'WA':'West Coast & Pacific', 'OR':'West Coast & Pacific', 'AK':'West Coast & Pacific', 'HI':'West Coast & Pacific', 'ID':'West Coast & Pacific', 'MT':'West Coast & Pacific', 'NV':'West Coast & Pacific', 'WY':'West Coast & Pacific',
        'AZ':'Southwest & Sunbelt', 'NM':'Southwest & Sunbelt', 'UT':'Southwest & Sunbelt', 'CO':'Southwest & Sunbelt', 'TX':'Southwest & Sunbelt', 'OK':'Southwest & Sunbelt',
        'IL':'Midwest & Great Lakes', 'IN':'Midwest & Great Lakes', 'IA':'Midwest & Great Lakes', 'KS':'Midwest & Great Lakes', 'MI':'Midwest & Great Lakes', 'MN':'Midwest & Great Lakes', 'MO':'Midwest & Great Lakes', 'NE':'Midwest & Great Lakes', 'ND':'Midwest & Great Lakes', 'OH':'Midwest & Great Lakes', 'SD':'Midwest & Great Lakes', 'WI':'Midwest & Great Lakes',
        'CT':'Northeast & Mid-Atlantic', 'DE':'Northeast & Mid-Atlantic', 'ME':'Northeast & Mid-Atlantic', 'MD':'Northeast & Mid-Atlantic', 'MA':'Northeast & Mid-Atlantic', 'NH':'Northeast & Mid-Atlantic', 'NJ':'Northeast & Mid-Atlantic', 'NY':'Northeast & Mid-Atlantic', 'PA':'Northeast & Mid-Atlantic', 'RI':'Northeast & Mid-Atlantic', 'VT':'Northeast & Mid-Atlantic',
        'AL':'Southeast & Gulf', 'AR':'Southeast & Gulf', 'FL':'Southeast & Gulf', 'GA':'Southeast & Gulf', 'KY':'Southeast & Gulf', 'LA':'Southeast & Gulf', 'MS':'Southeast & Gulf', 'NC':'Southeast & Gulf', 'SC':'Southeast & Gulf', 'TN':'Southeast & Gulf', 'VA':'Southeast & Gulf', 'WV':'Southeast & Gulf',
        'DC':'Northeast & Mid-Atlantic'
      };

      const grouped = cities.reduce((acc, city) => {
        const region = regionMap[city.state] || "Other Hubs";
        if (!acc[region]) acc[region] = [];
        acc[region].push(city);
        return acc;
      }, {});

      let html = "";
      for (const [regionName, regionCities] of Object.entries(grouped)) {
        html += `
          <div style="margin-top:28px;">
            <h3 style="margin:0 0 12px; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:var(--teal); font-weight:700;">
              ${regionName}
            </h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        `;
        
        regionCities.forEach(c => {
          html += `
            <a href="${linkPrefix}${c.slug}" class="city-nav-card" data-search="${c.name.toLowerCase()} ${c.state.toLowerCase()}" style="background:var(--panel); border:1px solid var(--panel-border); border-radius:var(--radius-md); padding:14px; text-decoration:none; display:flex; align-items:center; gap:12px; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); transition:border-color 0.2s;">
              <span style="font-size:22px;">${c.emoji}</span>
              <div>
                <h3 style="margin:0; font-size:14px; color:var(--text); font-weight:700;">${c.name}, ${c.state}</h3>
                <span style="font-size:11px; color:var(--muted);">${c.desc}</span>
              </div>
            </a>
          `;
        });
        
        html += `</div></div>`;
      }
      
      cityGrid.innerHTML = html;

      const searchInput = document.getElementById('citySearch');
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.city-nav-card').forEach(card => {
          // Find the closest region block to handle empty states during search
          const parentGroup = card.closest('div[style*="margin-top:28px"]');
          
          if(card.getAttribute('data-search').includes(term)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
          
          // Hide region headers if all cities underneath are filtered out
          if (parentGroup) {
            const visibleCards = parentGroup.querySelectorAll('.city-nav-card[style*="display: flex"]');
            parentGroup.style.display = visibleCards.length > 0 ? 'block' : 'none';
          }
        });
      });
    } catch(e) { console.error("Failed to load cities:", e); }
  }
});