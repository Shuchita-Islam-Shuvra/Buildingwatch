import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://khbebnbgewgbqcbgoayg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYmVibmJnZXdnYnFjYmdvYXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODQxNzUsImV4cCI6MjA5NTU2MDE3NX0.BnKoOQZIcH1mBQOhAE5Vnxz6aWE7enmEQsMByQGD-ZM'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function badge(level) {
  const l = (level||'').toLowerCase().replace(' ','')
  const map = {critical:'critical',high:'high',medium:'medium',low:'low',safe:'safe',active:'active',demolished:'demolish','under repair':'repair'}
  return `<span class="badge badge-${map[l]||'low'}">${level||'N/A'}</span>`
}

// ========== DASHBOARD ==========
async function loadDashboard() {
  const el = document.getElementById('page-dashboard')
  el.innerHTML = '<div class="loading">Loading...</div>'

  const [buildings, alerts, sensors, risks] = await Promise.all([
    supabase.from('building').select('*'),
    supabase.from('danger_alert').select('*').eq('is_resolved', false),
    supabase.from('sensor').select('*').eq('is_active', true),
    supabase.from('risk_assessment').select('*').eq('risk_category', 'Critical')
  ])

  const recentReadings = await supabase.from('sensor_reading')
    .select('*, sensor(sensor_type, floor(floor_number, building(building_name)))')
    .order('recorded_at', {ascending: false}).limit(10)

  const activeAlerts = await supabase.from('danger_alert')
    .select('*, building(building_name, city)')
    .eq('is_resolved', false)
    .order('triggered_at', {ascending: false})

  const riskBuildings = await supabase.from('risk_assessment')
    .select('*, building(building_name, city, building_type, status)')
    .order('risk_score', {ascending: false})

  el.innerHTML = `
    <div class="hero">
      <div>
        <h2>Structural Safety Monitoring System</h2>
        <p>Real-time building crack & danger tracking — Inspired by Rana Plaza Tragedy</p>
      </div>
      <div class="hero-icon">🏗️</div>
    </div>
    <div class="cards">
      <div class="card"><h2>${buildings.data?.length||0}</h2><p>Total Buildings</p></div>
      <div class="card red"><h2>${risks.data?.length||0}</h2><p>Critical Risk</p></div>
      <div class="card orange"><h2>${alerts.data?.length||0}</h2><p>Active Alerts</p></div>
      <div class="card green"><h2>${sensors.data?.length||0}</h2><p>Active Sensors</p></div>
    </div>
    <div class="section">
      <h3>🚨 Active Danger Alerts</h3>
      <table>
        <tr><th>Building</th><th>City</th><th>Level</th><th>Reason</th><th>Time</th></tr>
        ${activeAlerts.data?.map(a=>`<tr>
          <td><strong>${a.building?.building_name||''}</strong></td>
          <td>${a.building?.city||''}</td>
          <td>${badge(a.alert_level)}</td>
          <td>${a.trigger_reason||''}</td>
          <td>${new Date(a.triggered_at).toLocaleString()}</td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:#666">No active alerts</td></tr>'}
      </table>
    </div>
    <div class="section">
      <h3>🏢 Building Risk Overview</h3>
      <table>
        <tr><th>Building</th><th>City</th><th>Type</th><th>Risk Score</th><th>Category</th><th>Status</th></tr>
        ${riskBuildings.data?.map(r=>`<tr>
          <td><strong>${r.building?.building_name||''}</strong></td>
          <td>${r.building?.city||''}</td>
          <td>${r.building?.building_type||''}</td>
          <td>${r.risk_score}/100
            <div class="progress-bar"><div class="progress-fill" style="width:${r.risk_score}%"></div></div>
          </td>
          <td>${badge(r.risk_category)}</td>
          <td>${badge(r.building?.status)}</td>
        </tr>`).join('')||''}
      </table>
    </div>
    <div class="section">
      <h3>📡 Latest Sensor Readings</h3>
      <table>
        <tr><th>Building</th><th>Floor</th><th>Type</th><th>Value</th><th>Danger Level</th><th>Time</th></tr>
        ${recentReadings.data?.map(r=>`<tr>
          <td><strong>${r.sensor?.floor?.building?.building_name||''}</strong></td>
          <td>Floor ${r.sensor?.floor?.floor_number||''}</td>
          <td>${r.sensor?.sensor_type||''}</td>
          <td>${r.reading_value} ${r.unit}</td>
          <td>${badge(r.danger_level)}</td>
          <td>${new Date(r.recorded_at).toLocaleString()}</td>
        </tr>`).join('')||''}
      </table>
    </div>`
}

// ========== BUILDINGS ==========
async function loadBuildings() {
  const el = document.getElementById('page-buildings')
  el.innerHTML = '<div class="loading">Loading...</div>'

  const companies = await supabase.from('company').select('*')
  const buildings = await supabase.from('building')
    .select('*, company(company_name), risk_assessment(risk_score, risk_category)')
    .order('building_id')

  el.innerHTML = `
    <div class="section">
      <h3>➕ Add New Building</h3>
      <div class="form-grid">
        <div><label>Building ID</label><input id="b_id" placeholder="e.g. B008"></div>
        <div><label>Building Name</label><input id="b_name" placeholder="Building name"></div>
        <div><label>Address</label><input id="b_addr" placeholder="Full address"></div>
        <div><label>City</label><input id="b_city" placeholder="City"></div>
        <div><label>Total Floors</label><input id="b_floors" type="number" placeholder="5"></div>
        <div><label>Construction Year</label><input id="b_year" type="number" placeholder="2000"></div>
        <div><label>Building Type</label>
          <select id="b_type">
            <option>Garments</option><option>Factory</option>
            <option>Commercial</option><option>Residential</option>
            <option>Hospital</option><option>School</option>
          </select>
        </div>
        <div><label>Age (Years)</label><input id="b_age" type="number" placeholder="20"></div>
        <div><label>Company</label>
          <select id="b_company">
            ${companies.data?.map(c=>`<option value="${c.company_id}">${c.company_name}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-primary" onclick="addBuilding()">+ Add Building</button>
    </div>
    <div class="section">
      <h3>🏢 All Buildings</h3>
      <table>
        <tr><th>ID</th><th>Name</th><th>City</th><th>Type</th><th>Floors</th><th>Age</th><th>Risk</th><th>Status</th><th>Action</th></tr>
        ${buildings.data?.map(b=>{
          const risk = b.risk_assessment?.[0]
          return `<tr>
            <td>${b.building_id}</td>
            <td><strong>${b.building_name}</strong></td>
            <td>${b.city}</td>
            <td>${b.building_type}</td>
            <td>${b.total_floors}</td>
            <td>${b.age_years} yrs</td>
            <td>${risk ? badge(risk.risk_category) : '-'}</td>
            <td>${badge(b.status)}</td>
            <td><button class="btn-danger" onclick="deleteBuilding('${b.building_id}')">Delete</button></td>
          </tr>`
        }).join('')||''}
      </table>
    </div>`
}

window.addBuilding = async function() {
  const { error } = await supabase.from('building').insert([{
    building_id: document.getElementById('b_id').value,
    building_name: document.getElementById('b_name').value,
    address: document.getElementById('b_addr').value,
    city: document.getElementById('b_city').value,
    total_floors: parseInt(document.getElementById('b_floors').value),
    construction_year: parseInt(document.getElementById('b_year').value),
    building_type: document.getElementById('b_type').value,
    age_years: parseInt(document.getElementById('b_age').value),
    company_id: document.getElementById('b_company').value
  }])
  if(error) alert('Error: ' + error.message)
  else loadBuildings()
}

window.deleteBuilding = async function(id) {
  if(!confirm('Delete this building?')) return
  await supabase.from('evacuation_plan').delete().eq('building_id', id)
  await supabase.from('risk_assessment').delete().eq('building_id', id)
  await supabase.from('maintenance_log').delete().eq('building_id', id)
  await supabase.from('inspection').delete().eq('building_id', id)
  await supabase.from('danger_alert').delete().eq('building_id', id)
  await supabase.from('building').delete().eq('building_id', id)
  loadBuildings()
}

// ========== SENSORS ==========
async function loadSensors() {
  const el = document.getElementById('page-sensors')
  el.innerHTML = '<div class="loading">Loading...</div>'

  const sensors = await supabase.from('sensor')
    .select('*, floor(floor_number, building(building_name))')
    .eq('is_active', true)
    .order('sensor_id')

  const latestReadings = {}
  for(const s of sensors.data||[]) {
    const r = await supabase.from('sensor_reading')
      .select('*').eq('sensor_id', s.sensor_id)
      .order('recorded_at', {ascending: false}).limit(1)
    if(r.data?.[0]) latestReadings[s.sensor_id] = r.data[0]
  }

  const recent = await supabase.from('sensor_reading')
    .select('*, sensor(sensor_type, floor(building(building_name)))')
    .order('recorded_at', {ascending: false}).limit(15)

  el.innerHTML = `
    <div class="info-box">
      📡 Click <strong>⚡ Simulate</strong> on any sensor to generate a live random reading.
      If reading is <strong>High or Critical</strong>, system will auto-create a Danger Alert!
    </div>
    <div class="section">
      <h3>📡 All Sensors & Live Readings</h3>
      <table>
        <tr><th>Sensor</th><th>Building</th><th>Floor</th><th>Type</th><th>Location</th><th>Latest</th><th>Level</th><th>Time</th><th>Action</th></tr>
        ${sensors.data?.map(s=>{
          const r = latestReadings[s.sensor_id]
          return `<tr>
            <td>${s.sensor_id}</td>
            <td><strong>${s.floor?.building?.building_name||''}</strong></td>
            <td>Floor ${s.floor?.floor_number||''}</td>
            <td>${s.sensor_type}</td>
            <td>${s.location_desc}</td>
            <td>${r ? r.reading_value+' '+r.unit : 'No data'}</td>
            <td>${r ? badge(r.danger_level) : '-'}</td>
            <td>${r ? new Date(r.recorded_at).toLocaleString() : '-'}</td>
            <td><button class="btn-sim" onclick="simulate('${s.sensor_id}')">⚡ Simulate</button></td>
          </tr>`
        }).join('')||''}
      </table>
    </div>
    <div class="section">
      <h3>📊 Recent Readings (Last 15)</h3>
      <table>
        <tr><th>ID</th><th>Sensor</th><th>Building</th><th>Value</th><th>Level</th><th>Time</th></tr>
        ${recent.data?.map(r=>`<tr>
          <td>${r.reading_id}</td>
          <td>${r.sensor_id}</td>
          <td><strong>${r.sensor?.floor?.building?.building_name||''}</strong></td>
          <td>${r.reading_value} ${r.unit}</td>
          <td>${badge(r.danger_level)}</td>
          <td>${new Date(r.recorded_at).toLocaleString()}</td>
        </tr>`).join('')||''}
      </table>
    </div>`
}

window.simulate = async function(sensorId) {
  const val = parseFloat((Math.random()*95+5).toFixed(2))
  const level = val<20?'Safe':val<40?'Low':val<60?'Medium':val<80?'High':'Critical'
  const units = ['mm','Hz','kg/m2','degree','%']
  const unit = units[Math.floor(Math.random()*units.length)]
  const rid = 'R'+Math.floor(Math.random()*90000+10000)

  await supabase.from('sensor_reading').insert([{
    reading_id: rid, sensor_id: sensorId,
    reading_value: val, unit, danger_level: level,
    recorded_at: new Date().toISOString()
  }])

  if(level==='Critical'||level==='High') {
    const s = await supabase.from('sensor').select('floor(building_id)').eq('sensor_id', sensorId).single()
    const bid = s.data?.floor?.building_id
    if(bid) {
      const existing = await supabase.from('danger_alert').select('*').eq('building_id', bid).eq('is_resolved', false)
      if(!existing.data?.length) {
        await supabase.from('danger_alert').insert([{
          alert_id: 'AL'+Math.floor(Math.random()*90000+10000),
          building_id: bid, alert_level: level,
          triggered_at: new Date().toISOString(),
          trigger_reason: `Auto-triggered: Sensor ${sensorId} reading ${val}`,
          is_resolved: false
        }])
      }
    }
  }
  loadSensors()
}

// ========== ALERTS ==========
async function loadAlerts() {
  const el = document.getElementById('page-alerts')
  el.innerHTML = '<div class="loading">Loading...</div>'

  const active = await supabase.from('danger_alert')
    .select('*, building(building_name, city)')
    .eq('is_resolved', false).order('triggered_at', {ascending: false})

  const notifications = await supabase.from('notification')
    .select('*, contact_person(name, email), danger_alert(alert_level, building(building_name))')
    .order('sent_at', {ascending: false})

  const resolved = await supabase.from('danger_alert')
    .select('*, building(building_name)')
    .eq('is_resolved', true).order('resolved_at', {ascending: false})

  el.innerHTML = `
    <div class="section">
      <h3>🚨 Active Danger Alerts</h3>
      <table>
        <tr><th>ID</th><th>Building</th><th>City</th><th>Level</th><th>Reason</th><th>Time</th><th>Action</th></tr>
        ${active.data?.map(a=>`<tr>
          <td>${a.alert_id}</td>
          <td><strong>${a.building?.building_name||''}</strong></td>
          <td>${a.building?.city||''}</td>
          <td>${badge(a.alert_level)}</td>
          <td>${a.trigger_reason||''}</td>
          <td>${new Date(a.triggered_at).toLocaleString()}</td>
          <td><button class="btn-success" onclick="resolveAlert('${a.alert_id}')">✓ Resolve</button></td>
        </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:#666">No active alerts</td></tr>'}
      </table>
    </div>
    <div class="section">
      <h3>📨 Notifications</h3>
      ${notifications.data?.map(n=>`
        <div class="notif-card ${n.status==='Sent'?'sent':''}">
          <h4>📧 ${n.contact_person?.name||''} (${n.contact_person?.email||''}) — ${n.danger_alert?.building?.building_name||''}
            <span style="color:${n.status==='Sent'?'#2a9d8f':'#e63946'};font-size:12px;margin-left:8px;">${n.status}</span>
          </h4>
          <p>${n.message||''}</p>
          <p style="margin-top:4px;font-size:12px;">Method: ${n.method} | Sent: ${new Date(n.sent_at).toLocaleString()}</p>
        </div>`).join('')||'<p style="color:#666">No notifications</p>'}
    </div>
    <div class="section">
      <h3>✅ Resolved Alerts</h3>
      <table>
        <tr><th>ID</th><th>Building</th><th>Level</th><th>Triggered</th><th>Resolved</th></tr>
        ${resolved.data?.map(a=>`<tr>
          <td>${a.alert_id}</td>
          <td><strong>${a.building?.building_name||''}</strong></td>
          <td>${badge(a.alert_level)}</td>
          <td>${new Date(a.triggered_at).toLocaleString()}</td>
          <td style="color:#2a9d8f">✓ ${new Date(a.resolved_at).toLocaleString()}</td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:#666">No resolved alerts</td></tr>'}
      </table>
    </div>`
}

window.resolveAlert = async function(id) {
  if(!confirm('Mark as resolved?')) return
  await supabase.from('danger_alert').update({is_resolved: true, resolved_at: new Date().toISOString()}).eq('alert_id', id)
  loadAlerts()
}

// ========== REPORTS ==========
async function loadReports() {
  const el = document.getElementById('page-reports')
  el.innerHTML = '<div class="loading">Loading...</div>'

  const [risks, maintenance, inspections, evacuation] = await Promise.all([
    supabase.from('risk_assessment').select('*, building(building_name, city, building_type, age_years)').order('risk_score', {ascending: false}),
    supabase.from('maintenance_log').select('*, building(building_name)').order('maintenance_date', {ascending: false}),
    supabase.from('inspection').select('*, building(building_name), inspector(name)').order('inspection_date', {ascending: false}),
    supabase.from('evacuation_plan').select('*, building(building_name), emergency_team(team_name, contact_number, is_available)')
  ])

  const total = risks.data?.length||0
  const critical = risks.data?.filter(r=>r.risk_category==='Critical').length||0
  const high = risks.data?.filter(r=>r.risk_category==='High').length||0
  const medium = risks.data?.filter(r=>r.risk_category==='Medium').length||0
  const low = risks.data?.filter(r=>r.risk_category==='Low').length||0
  const avg = total ? (risks.data.reduce((s,r)=>s+parseFloat(r.risk_score),0)/total).toFixed(1) : 0

  el.innerHTML = `
    <div class="section">
      <h3>📊 System Overview</h3>
      <div class="stat-grid">
        <div class="stat-box"><h2>${total}</h2><p>Total Assessed</p></div>
        <div class="stat-box"><h2 style="color:#c1121f">${critical}</h2><p>Critical</p></div>
        <div class="stat-box"><h2 style="color:#e07000">${high}</h2><p>High Risk</p></div>
        <div class="stat-box"><h2 style="color:#b38600">${medium}</h2><p>Medium</p></div>
        <div class="stat-box"><h2 style="color:#1a7a72">${low}</h2><p>Low Risk</p></div>
        <div class="stat-box"><h2>${avg}</h2><p>Avg Score</p></div>
      </div>
    </div>
    <div class="section">
      <h3>🏢 Risk Assessment</h3>
      <table>
        <tr><th>Building</th><th>City</th><th>Type</th><th>Age</th><th>Score</th><th>Category</th><th>Recommendation</th></tr>
        ${risks.data?.map(r=>`<tr>
          <td><strong>${r.building?.building_name||''}</strong></td>
          <td>${r.building?.city||''}</td>
          <td>${r.building?.building_type||''}</td>
          <td>${r.building?.age_years||''} yrs</td>
          <td>${r.risk_score}/100
            <div class="progress-bar"><div class="progress-fill" style="width:${r.risk_score}%"></div></div>
          </td>
          <td>${badge(r.risk_category)}</td>
          <td style="font-size:12px;color:#666">${r.recommendation||''}</td>
        </tr>`).join('')||''}
      </table>
    </div>
    <div class="section">
      <h3>🔧 Maintenance Log</h3>
      <table>
        <tr><th>Building</th><th>Date</th><th>Work</th><th>Contractor</th><th>Cost</th><th>Status</th></tr>
        ${maintenance.data?.map(m=>{
          const sc = m.status==='Completed'?'#1a7a72':m.status==='Ongoing'?'#e07000':'#666'
          return `<tr>
            <td><strong>${m.building?.building_name||''}</strong></td>
            <td>${m.maintenance_date}</td>
            <td>${m.work_type}</td>
            <td>${m.contractor_name}</td>
            <td>৳${Number(m.cost).toLocaleString()}</td>
            <td style="color:${sc};font-weight:bold">${m.status}</td>
          </tr>`
        }).join('')||''}
      </table>
    </div>
    <div class="section">
      <h3>🔍 Inspection History</h3>
      <table>
        <tr><th>Building</th><th>Inspector</th><th>Date</th><th>Condition</th><th>Crack %</th><th>Next</th></tr>
        ${inspections.data?.map(i=>{
          const cc = i.overall_condition==='Critical'?'#c1121f':i.overall_condition==='Poor'?'#e07000':i.overall_condition==='Fair'?'#b38600':'#1a7a72'
          return `<tr>
            <td><strong>${i.building?.building_name||''}</strong></td>
            <td>${i.inspector?.name||''}</td>
            <td>${i.inspection_date}</td>
            <td style="color:${cc};font-weight:bold">${i.overall_condition}</td>
            <td>${i.crack_percentage}%</td>
            <td>${i.next_inspection_date||'-'}</td>
          </tr>`
        }).join('')||''}
      </table>
    </div>
    <div class="section">
      <h3>🚒 Evacuation Plans</h3>
      <table>
        <tr><th>Building</th><th>Primary Exit</th><th>Assembly Point</th><th>Team</th><th>Contact</th></tr>
        ${evacuation.data?.map(e=>{
          const av = e.emergency_team?.is_available?'#1a7a72':'#c1121f'
          return `<tr>
            <td><strong>${e.building?.building_name||''}</strong></td>
            <td>${e.primary_exit}</td>
            <td>${e.assembly_point||''}</td>
            <td style="color:${av};font-weight:bold">${e.emergency_team?.team_name||''} ${e.emergency_team?.is_available?'✓':'✗'}</td>
            <td>${e.emergency_team?.contact_number||''}</td>
          </tr>`
        }).join('')||''}
      </table>
    </div>`
}

// ========== NAVIGATION ==========
window.showPage = function(page) {
  ['dashboard','buildings','sensors','alerts','reports'].forEach(p => {
    document.getElementById('page-'+p).style.display = p===page ? 'block' : 'none'
    document.getElementById('nav-'+p).classList.toggle('active', p===page)
  })
  if(page==='dashboard') loadDashboard()
  else if(page==='buildings') loadBuildings()
  else if(page==='sensors') loadSensors()
  else if(page==='alerts') loadAlerts()
  else if(page==='reports') loadReports()
}

// Load dashboard on start
loadDashboard()