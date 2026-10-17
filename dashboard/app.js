/* Presentation and interactions. No requests, external libraries or credentials. */
(() => {
  'use strict';
  const data = globalThis.ICO_DATA;
  const A = globalThis.ICOAnalytics;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = (value, digits = 0) => value === null || value === undefined ? 'N/D' : new Intl.NumberFormat('es-MX', {minimumFractionDigits:digits, maximumFractionDigits:digits}).format(value);
  const dateLabel = (value, options = {day:'2-digit',month:'short'}) => new Date(value + 'T12:00:00Z').toLocaleDateString('es-MX', {...options, timeZone:'UTC'}).replace(/\./g,'');
  const compact = value => value >= 1e6 ? number(value / 1e6, 2) + ' M' : number(value);
  const companyName = value => 'Empresa ' + value.slice(-2);
  const lineName = value => 'Línea ' + value.slice(-2);
  const names = {R:'Reglas operativas', H:'Hechos de tránsito', I:'Infracciones'};
  const colors = {R:'#368d7a', H:'#d7a36b', I:'#9185ba'};
  const statuses = {valid:'Validado', pending:'Pendiente', dismissed:'Desestimado'};
  const responsibility = {operator:'Operador', company:'Empresa', external:'Tercero', pending:'Pendiente de determinar'};
  const state = {start:'2025-01-01', end:'2025-12-31', company:'', line:'', metric:'risk', frequency:'month', dimension:'company', page:1, showAll:false};
  const pageSize = 8;
  let current;
  let toastTimer;

  if (!data || !A) {
    $('filter-error').hidden = false;
    $('filter-error').textContent = 'No se pudieron cargar los datos de la demo. Comprueba que data.js esté disponible.';
    return;
  }
  function addOptions(select, values, label) {
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value; option.textContent = label(value); select.append(option);
    });
  }
  addOptions($('company'), [...new Set(data.exposure.map(e => e.company))].sort(), companyName);
  addOptions($('line'), [...new Set(data.exposure.map(e => e.line))].sort(), lineName);

  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
  }
  function kpi(label, icon, value, unit, footer, primary = false) {
    return `<article class="kpi ${primary ? 'kpi-primary' : ''}"><div class="kpi-label"><span>${label}</span><span class="kpi-icon" aria-hidden="true">${icon}</span></div><div class="kpi-value">${value}${unit ? `<small>${unit}</small>` : ''}</div><div class="kpi-foot">${footer}</div></article>`;
  }
  function renderKPIs(summary) {
    const previous = A.previousPeriod(data, state);
    let riskFooter = 'Escala 0–1 · menor es mejor';
    if (previous && previous.ico_risk !== null && summary.ico_risk !== null) {
      const delta = summary.ico_risk - previous.ico_risk;
      riskFooter = `<span class="delta ${delta > 0 ? 'adverse' : ''}">${delta > 0 ? '↑' : delta < 0 ? '↓' : '='} ${number(Math.abs(delta),3)}</span> vs. periodo anterior equivalente`;
    }
    $('kpis').innerHTML = kpi('ICO_riesgo', '↗', number(summary.ico_risk,3), '', riskFooter, true) +
      kpi('Eventos elegibles', '◎', number(summary.eligible), '', `${number(summary.observed)} eventos observados en el periodo`) +
      kpi('Exposición operativa', '↔', compact(summary.km), 'km', `${number(new Set(current.exposure.map(e => e.date)).size)} días con operación registrada`) +
      kpi('Registros consolidados', '⇄', number(summary.consolidated), '', `${number(summary.retries)} reintentos · ${number(summary.linked)} vínculos entre fuentes`);
    $('integration-text').textContent = `${number(summary.input)} registros de origen → ${number(summary.observed)} eventos únicos. ${number(summary.observed - summary.eligible)} eventos sin contribución elegible se conservan para revisión.`;
  }

  function renderTrend() {
    const buckets = A.timeBuckets(data, current, state.start, state.end, state.frequency);
    const risk = state.metric === 'risk';
    const values = buckets.map(b => risk ? b.ico_risk : b.eligible);
    const available = values.filter(v => v !== null);
    const chart = $('trend-chart');
    $('trend-caption').textContent = risk ? 'Evolución del ICO_riesgo en el periodo' : 'Eventos elegibles por intervalo · conteo sin ajustar por exposición';
    $('trend-legend').textContent = risk ? 'ICO_riesgo · menor es mejor' : 'Eventos elegibles · conteo';
    if (!available.length) { chart.innerHTML = '<div class="empty"><b>Sin exposición suficiente</b>No hay un índice calculable para este ámbito.</div>'; return; }
    const width = 620, height = 240, left = 43, right = 14, top = 18, bottom = 36;
    const plotW = width-left-right, plotH = height-top-bottom;
    const maximum = Math.max(...available, risk ? .05 : 1);
    const step = risk ? Math.max(.025, Math.ceil(maximum / 4 / .025) * .025) : Math.max(1, Math.ceil(maximum / 4));
    const limit = step * 4;
    const x = i => left + (buckets.length === 1 ? plotW/2 : i * plotW / (buckets.length-1));
    const y = value => top + plotH - value / limit * plotH;
    let markup = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="trend-title trend-desc"><title id="trend-title">${risk ? 'ICO_riesgo' : 'Eventos elegibles'} por ${state.frequency === 'month' ? 'mes' : 'semana'}</title><desc id="trend-desc">${buckets.length} intervalos. Usa Tab para consultar cada punto. Los intervalos sin índice calculable se muestran como huecos.</desc><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7fbea5" stop-opacity="0.28"/><stop offset="100%" stop-color="#7fbea5" stop-opacity="0.01"/></linearGradient></defs>`;
    for (let i=0;i<=4;i++) {
      const value = step*i;
      markup += `<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" class="trend-grid"/><text x="${left-11}" y="${y(value)+3}" text-anchor="end" class="trend-axis">${number(value,risk ? 2 : 0)}</text>`;
    }
    // Separate paths at missing values rather than interpolating across absent data.
    let segment = [];
    const drawSegment = () => {
      if (!segment.length) return;
      const line = segment.map((p,i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
      markup += `<path d="${line} L ${segment.at(-1)[0]} ${top+plotH} L ${segment[0][0]} ${top+plotH} Z" fill="url(#trend-fill)"/><path d="${line}" class="trend-line"/>`;
      segment = [];
    };
    values.forEach((value,i) => { if (value === null) drawSegment(); else segment.push([x(i),y(value)]); }); drawSegment();
    const labelEvery = Math.max(1, Math.ceil(buckets.length / 8));
    let lastLabel = -labelEvery;
    buckets.forEach((b,i) => {
      if (i % labelEvery === 0 || (i === buckets.length-1 && i-lastLabel >= Math.max(1,labelEvery*0.7))) {
        const label = state.frequency === 'month' ? dateLabel(b.start,{month:'short'}) : dateLabel(b.start);
        markup += `<text x="${x(i)}" y="${height-9}" text-anchor="middle" class="trend-axis">${escape(label)}</text>`;
        lastLabel = i;
      }
      if (values[i] !== null) {
        const hint = `${dateLabel(b.start)} – ${dateLabel(b.end)}: ${number(values[i],risk ? 3 : 0)} ${risk ? 'ICO_riesgo' : 'eventos elegibles'}`;
        markup += `<g><circle class="chart-hit" tabindex="0" role="img" aria-label="${escape(hint)}" data-point="${i}" cx="${x(i)}" cy="${y(values[i])}" r="${buckets.length>20 ? 7 : 14}"><title>${escape(hint)}</title></circle><circle class="trend-point" pointer-events="none" cx="${x(i)}" cy="${y(values[i])}" r="${buckets.length>20 ? 2.5 : 3.5}"/></g>`;
      }
    });
    chart.innerHTML = markup + '</svg><div class="chart-tooltip" hidden></div>';
    const tooltip = chart.querySelector('.chart-tooltip');
    chart.querySelectorAll('[data-point]').forEach(point => {
      const index = Number(point.dataset.point), bucket = buckets[index];
      function show() {
        tooltip.innerHTML = `${escape(dateLabel(bucket.start))} — ${escape(dateLabel(bucket.end))}<b>${number(values[index],risk ? 3 : 0)} ${risk ? '' : 'eventos'}</b>`;
        tooltip.style.left = `${Math.min(85,Math.max(15,x(index)/width*100))}%`;
        tooltip.style.top = `${Math.max(35,y(values[index])/height*chart.offsetHeight)}px`;
        tooltip.hidden = false;
      }
      point.addEventListener('mouseenter',show); point.addEventListener('focus',show);
      point.addEventListener('mouseleave',() => {tooltip.hidden=true;}); point.addEventListener('blur',() => {tooltip.hidden=true;});
    });
  }

  function renderComponents(summary) {
    const contributions = A.components.map(c => summary.scaled ? summary.scaled[c] * data.methodology.weights[c] : null);
    const total = contributions.reduce((sum,v)=>sum+(v||0),0);
    const circumference = 2*Math.PI*53;
    let offset = 0;
    const arcs = A.components.map((c,i) => {
      const portion = total ? contributions[i]/total : 0;
      const length = circumference*portion;
      const markup = `<circle cx="75" cy="75" r="53" fill="none" stroke="${colors[c]}" stroke-width="14" stroke-dasharray="${Math.max(0,length-(portion?3:0))} ${circumference}" stroke-dashoffset="${-offset}"/>`;
      offset += length; return markup;
    }).join('');
    $('component-visual').innerHTML = `<svg viewBox="0 0 150 150" role="img" aria-label="Composición del ICO_riesgo. ${A.components.map((c,i)=>names[c]+': '+number(contributions[i],3)).join('; ')}"><circle cx="75" cy="75" r="53" fill="none" stroke="#eff3ed" stroke-width="14"/>${arcs}</svg><div class="donut-center"><strong>${number(summary.ico_risk,3)}</strong>ICO_riesgo</div>`;
    $('component-rows').innerHTML = A.components.map((c,i) => `<div class="component-row"><span class="component-letter" style="color:${colors[c]};background:${colors[c]}18">${c}</span><div class="component-name">${names[c]}<small>${number(summary.counts[c])} eventos · peso ${number(data.methodology.weights[c]*100)}%</small><span class="component-meter"><span style="background:${colors[c]};width:${total ? contributions[i]/total*100 : 0}%"></span></span></div><div class="component-value">${number(contributions[i],3)}</div></div>`).join('');
  }

  function renderComparison() {
    const dimension = state.dimension;
    const rows = A.groups(data,current,dimension,state.start,state.end);
    const sort = $('sort-companies').value;
    rows.sort((a,b) => sort === 'risk-desc' ? (b.ico_risk ?? -1)-(a.ico_risk ?? -1) :
      sort === 'risk-asc' ? (a.ico_risk ?? Infinity)-(b.ico_risk ?? Infinity) :
      sort === 'events' ? b.eligible-a.eligible : a.entity.localeCompare(b.entity));
    const shown = state.showAll ? rows : rows.slice(0,6);
    const maxRisk = Math.max(...rows.map(r=>r.ico_risk||0),.001);
    $('comparison-caption').textContent = `${number(rows.length)} ${dimension === 'company' ? (rows.length===1?'empresa':'empresas') : (rows.length===1?'línea':'líneas')} · tasas por 100,000 km`;
    $('show-all-companies').hidden = rows.length <= 6;
    $('show-all-companies').textContent = state.showAll ? 'Mostrar menos ↑' : `Ver ${rows.length === 17 ? 'las 17' : 'todas las'} ${dimension === 'company' ? 'empresas' : 'líneas'} ↓`;
    if (!rows.length) { $('comparison-table').innerHTML = '<div class="empty"><b>No hay entidades en esta selección</b>Prueba con otra empresa, línea o periodo.</div>'; return; }
    $('comparison-table').innerHTML = `<table><caption class="sr-only">Comparación por ${dimension === 'company' ? 'empresa' : 'línea'}, con tasas por 100,000 kilómetros y referencias fijas</caption><thead><tr><th>${dimension === 'company' ? 'Empresa operadora' : 'Línea de servicio'}</th><th class="numeric">Eventos elegibles</th><th class="numeric">Exposición · km</th><th class="numeric">R · tasa</th><th class="numeric">H · tasa</th><th class="numeric">I · tasa</th><th class="numeric">ICO_riesgo</th><th><span class="sr-only">Explorar</span></th></tr></thead><tbody>${shown.map(row=>`<tr><td><div class="entity-cell"><span class="entity-icon">${row.entity.slice(-2)}</span><button data-entity="${escape(row.entity)}">${dimension === 'company' ? companyName(row.entity) : lineName(row.entity)}<small>${escape(row.entity)}</small></button></div></td><td class="numeric">${number(row.eligible)}</td><td class="numeric">${number(row.km)}</td>${A.components.map(c=>`<td class="numeric">${number(row.rates_per_100k_km?.[c],2)}</td>`).join('')}<td><div class="risk-cell"><div class="risk-track" aria-hidden="true"><span style="width:${(row.ico_risk||0)/maxRisk*100}%"></span></div><b>${number(row.ico_risk,3)}</b></div></td><td><button class="explore-button" data-entity="${escape(row.entity)}" aria-label="Explorar ${dimension==='company'?companyName(row.entity):lineName(row.entity)}">↗</button></td></tr>`).join('')}</tbody></table>`;
    $('comparison-table').querySelectorAll('[data-entity]').forEach(button=>button.addEventListener('click',()=>{
      $(dimension).value=button.dataset.entity; applyFilters(); $('overview').scrollIntoView({block:'start'});
    }));
  }

  function filteredEvents() {
    const query = $('event-search').value.trim().toLowerCase();
    const component = $('event-component').value;
    const link = $('event-link').value;
    return current.events.filter(event => (!query || [event.incident_ref,event.operator,event.company,event.line,companyName(event.company),lineName(event.line)].join(' ').toLowerCase().includes(query)) &&
      (!component || (component==='excluded' ? !event.component : event.component===component)) &&
      (!link || (link==='linked' ? event.evidence.length>1 : link==='retry' ? event.input_count>event.evidence.length : event.human_review_alert)))
      .sort((a,b)=>b.date.localeCompare(a.date)||a.incident_ref.localeCompare(b.incident_ref));
  }
  function renderEvents() {
    const events = filteredEvents();
    const pages = Math.max(1,Math.ceil(events.length/pageSize));
    state.page = Math.min(state.page,pages);
    const start = (state.page-1)*pageSize;
    const shown = events.slice(start,start+pageSize);
    if (!events.length) $('event-table').innerHTML = '<div class="empty"><b>No encontramos eventos con estos filtros</b>Modifica la búsqueda o el componente. Los filtros de esta tabla no cambian el ICO del ámbito.</div>';
    else $('event-table').innerHTML = `<table><caption class="sr-only">Eventos de la selección. Los filtros de la tabla no modifican el índice. Abre un evento para consultar evidencia.</caption><thead><tr><th>Evento / fecha</th><th>Operador</th><th>Empresa / línea</th><th>Componente</th><th class="numeric">Puntos</th><th class="numeric">Fuentes</th><th><span class="sr-only">Abrir evento</span></th></tr></thead><tbody>${shown.map(event=>`<tr><td><button class="event-id" data-event="${escape(event.incident_ref)}">${escape(event.incident_ref)}</button><div style="font-size:8px;color:#8b9c8e;margin-top:4px">${dateLabel(event.date,{day:'2-digit',month:'short',year:'numeric'})}</div></td><td>${escape(event.operator)}</td><td>${companyName(event.company)}<div style="font-size:8px;color:#8b9c8e">${lineName(event.line)}</div></td><td><span class="component-badge badge-${event.component||'excluded'}">${event.component?event.component+' · '+names[event.component]:'Sin contribución'}</span></td><td class="numeric">${number(event.points,event.points%1 ? 1:0)}</td><td class="numeric"><span class="${event.evidence.length>1?'linked-pill':''}">${event.evidence.length}${event.evidence.length>1?' vinculadas':''}</span></td><td><button class="explore-button" data-event="${escape(event.incident_ref)}" aria-label="Abrir ${escape(event.incident_ref)}">↗</button></td></tr>`).join('')}</tbody></table>`;
    $('event-table').querySelectorAll('[data-event]').forEach(button=>button.addEventListener('click',()=>openEvent(button.dataset.event)));
    $('event-range').textContent = events.length ? `${number(start+1)}–${number(Math.min(start+pageSize,events.length))} de ${number(events.length)} eventos` : '0 eventos';
    $('page-label').textContent = `${state.page} / ${pages}`;
    $('prev-page').disabled = state.page<=1; $('next-page').disabled=state.page>=pages;
  }

  function openEvent(id) {
    const event = current.events.find(e=>e.incident_ref===id);
    if (!event) return;
    $('dialog-title').textContent=event.incident_ref;
    const selectedKey = JSON.stringify(event.selected_record);
    const exclusionReasons = [...new Set(event.evidence.map(e=>e.status!=='valid'?statuses[e.status]:e.responsibility!=='operator'?'Responsabilidad: '+responsibility[e.responsibility]:'Sin selección'))].join(' · ');
    $('dialog-body').innerHTML = `<div class="dialog-content"><div class="dialog-summary ${event.component?'':'excluded'}"><span class="integration-icon" aria-hidden="true">${event.component?'✓':'–'}</span><div><strong>${event.component?`Una contribución a ${names[event.component]}`:'Sin contribución al índice'}</strong><p>${event.component?`${number(event.points,event.points%1?1:0)} puntos · prioridad exclusiva H → I → R` : escape(exclusionReasons)}</p></div></div><dl class="detail-grid"><div><dt>Fecha del hecho</dt><dd>${dateLabel(event.date,{day:'2-digit',month:'long',year:'numeric'})}</dd></div><div><dt>Operador ficticio</dt><dd>${escape(event.operator)}</dd></div><div><dt>Adscripción</dt><dd>${companyName(event.company)} · ${lineName(event.line)}</dd></div><div><dt>Registros recibidos</dt><dd>${number(event.input_count)} en origen</dd></div><div><dt>Registros vigentes</dt><dd>${number(event.evidence.length)} tras reintentos y revisiones</dd></div><div><dt>Registros seleccionados</dt><dd>${event.component?'1 contribución':'Ninguno elegible'}</dd></div></dl>${event.human_review_alert?'<div class="alert-note">Alerta para revisión humana. Esta alerta no determina sanciones ni bajas.</div>':''}<h3 class="evidence-heading">La evidencia que sostiene el resultado</h3>${event.evidence.map(record=>{
      const chosen=JSON.stringify([record.source,record.source_id,record.revision])===selectedKey;
      return `<article class="evidence-card ${chosen?'chosen':''}"><div class="evidence-card-header"><strong>${escape(record.source)} · ${escape(record.source_id)}</strong><span class="evidence-tag">${chosen?'Contribución seleccionada':record.status==='valid'&&record.responsibility==='operator'?'Evidencia vinculada, sin sumar':'Registro no elegible'}</span></div><p><span class="component-badge badge-${record.component}">${record.component} · ${names[record.component]}</span> &nbsp; Código ${escape(record.code)} · Revisión ${number(record.revision)}</p><p>${statuses[record.status]} · Responsabilidad: ${responsibility[record.responsibility]} · Lesionados: ${number(record.injured)} · Fallecidos: ${number(record.fatalities)}</p></article>`;
    }).join('')}<div class="decision-note">La identidad se vincula por referencia explícita compartida. Se conservan todos los registros de origen; la asignación exclusiva evita sumar varias fuentes del mismo hecho. El catálogo y la precedencia son ilustrativos.</div></div>`;
    $('event-dialog').showModal();
  }

  function render() {
    current = A.summarize(data,state);
    renderKPIs(current.summary); renderTrend(); renderComponents(current.summary); renderComparison(); renderEvents();
    $('scope-label').textContent = [state.company?companyName(state.company):'',state.line?lineName(state.line):''].filter(Boolean).join(' / ') || 'Sistema completo';
    $('period-label').textContent = `${dateLabel(state.start)} — ${dateLabel(state.end,{day:'2-digit',month:'short',year:'numeric'})}`;
    const entities=[...current.events,...current.exposure];
    const companyCount=new Set(entities.map(e=>e.company)).size, lineCount=new Set(entities.map(e=>e.line)).size;
    $('scope-count').textContent=`${companyCount} ${companyCount===1?'empresa':'empresas'} / ${lineCount} ${lineCount===1?'línea':'líneas'}`;
    $('filter-error').hidden=!current.summary.quality_issues.length;
    if(current.summary.quality_issues.length) $('filter-error').textContent='El ICO no es calculable para esta selección: falta exposición o cobertura suficiente. Los conteos observados se conservan.';
  }

  function applyFilters() {
    const periods={year:['2025-01-01','2025-12-31'],q1:['2025-01-01','2025-03-31'],q2:['2025-04-01','2025-06-30'],q3:['2025-07-01','2025-09-30'],q4:['2025-10-01','2025-12-31']};
    const period=$('period').value;
    $('custom-dates').hidden=period!=='custom';
    const selected=period==='custom'?[$('start').value,$('end').value]:periods[period];
    if(!selected[0]||!selected[1]||selected[0]>selected[1]||selected[0]<data.coverage.start||selected[1]>data.coverage.end){
      $('filter-error').hidden=false; $('filter-error').textContent='Selecciona fechas válidas entre el 1 de enero y el 31 de diciembre de 2025. No se aplicaron las fechas.'; return;
    }
    [state.start,state.end]=selected;
    state.company=$('company').value; state.line=$('line').value; state.page=1; state.showAll=false;
    $('start').value=state.start; $('end').value=state.end;
    // Disable incompatible options while leaving both independent filters explicit.
    [...$('line').options].forEach(option=>{option.disabled=!!(option.value&&state.company&&!data.exposure.some(e=>e.company===state.company&&e.line===option.value));});
    [...$('company').options].forEach(option=>{option.disabled=!!(option.value&&state.line&&!data.exposure.some(e=>e.line===state.line&&e.company===option.value));});
    render();
  }
  $('filters').addEventListener('submit',event=>{event.preventDefault();applyFilters();});
  ['period','company','line'].forEach(id=>$(id).addEventListener('change',applyFilters));
  $('reset').addEventListener('click',()=>{
    $('period').value='year';$('company').value='';$('line').value='';$('event-search').value='';$('event-component').value='';$('event-link').value='';applyFilters();toast('Vista del sistema restablecida');
  });
  $('frequency').addEventListener('change',()=>{state.frequency=$('frequency').value;renderTrend();});
  document.querySelectorAll('[data-metric]').forEach(button=>button.addEventListener('click',()=>{
    state.metric=button.dataset.metric;
    document.querySelectorAll('[data-metric]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderTrend();
  }));
  document.querySelectorAll('[data-dimension]').forEach(button=>button.addEventListener('click',()=>{
    state.dimension=button.dataset.dimension;state.showAll=false;
    document.querySelectorAll('[data-dimension]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});renderComparison();
  }));
  $('sort-companies').addEventListener('change',renderComparison);
  $('show-all-companies').addEventListener('click',()=>{state.showAll=!state.showAll;renderComparison();});
  ['event-component','event-link'].forEach(id=>$(id).addEventListener('change',()=>{state.page=1;renderEvents();}));
  $('event-search').addEventListener('input',()=>{state.page=1;renderEvents();});
  $('prev-page').addEventListener('click',()=>{state.page--;renderEvents();});
  $('next-page').addEventListener('click',()=>{state.page++;renderEvents();});
  $('view-linked').addEventListener('click',()=>{$('event-link').value='linked';$('event-component').value='';$('event-search').value='';state.page=1;renderEvents();$('events').scrollIntoView({block:'start'});});

  function csvCell(value) {
    let text=String(value??'');
    if(/^[=+\-@]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function downloadCSV(headers,rows,name) {
    const content='\ufeff'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Descarga preparada con los filtros actuales');
  }
  $('export-summary').addEventListener('click',()=>{
    const s=current.summary;
    downloadCSV(['inicio','fin','empresa','linea','eventos_observados','eventos_elegibles','km','puntos_R','puntos_H','puntos_I','tasa_R_por_100k_km','tasa_H_por_100k_km','tasa_I_por_100k_km','ICO_riesgo','calidad','metodologia'],[[state.start,state.end,state.company||'todas',state.line||'todas',s.observed,s.eligible,s.km,...A.components.map(c=>s.points[c]),...A.components.map(c=>s.rates_per_100k_km?.[c]),s.ico_risk,s.quality_issues.join('|'),data.methodology.version]],`ico-resumen-${state.start}-${state.end}.csv`);
  });
  $('export-events').addEventListener('click',()=>downloadCSV(['evento','fecha','operador','empresa','linea','componente','puntos','registros_origen','registros_vigentes','alerta_revision'],filteredEvents().map(e=>[e.incident_ref,e.date,e.operator,e.company,e.line,e.component||'sin_contribucion',e.points,e.input_count,e.evidence.length,e.human_review_alert]),`ico-eventos-${state.start}-${state.end}.csv`));

  function openMethod(){ $('method-dialog').showModal(); }
  $('reference-values').innerHTML=A.components.map(c=>`<div class="reference-card"><dt>${c} · ${names[c]}</dt><dd>${number(data.methodology.reference_caps[c])}<small>puntos / 100,000 km</small></dd></div>`).join('');
  $('provenance').innerHTML=`<p>Motor ${escape(data.engine_version)} · Metodología ${escape(data.methodology.version)} · Semilla ${escape(data.seed)}<br>Referencia: ${escape(data.methodology.reference_id)}</p><p>SHA-256 de datos<br><code>${escape(data.input_sha256)}</code></p><p>SHA-256 de configuración<br><code>${escape(data.config_sha256)}</code></p>`;
  $('about-button').addEventListener('click',openMethod);$('method-open').addEventListener('click',openMethod);
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  });
  $('menu-toggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.nav-item').forEach(link=>link.addEventListener('click',()=>{$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}});
  document.addEventListener('click',event=>{if(!$('sidebar').contains(event.target)&&!$('menu-toggle').contains(event.target)){$('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}});
  const observer = new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.nav-item').forEach(link=>link.classList.toggle('active',link.dataset.section===entry.target.id));}});},{rootMargin:'-10% 0px -65% 0px'});
  ['overview','trends','comparison','events','methodology'].forEach(id=>observer.observe($(id)));
  $('filters').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName!=='BUTTON'){event.preventDefault();applyFilters();}});
  render();
})();
