/* Minimal JS to simulate dynamic behaviour for Phase 1.
   - Stores sample events in memory
   - Implements search/filter on events.html
   - Simulates signup/login/register actions using localStorage (browser only)
   - Admin can add events (saved to localStorage for demo)
   - Event detail page reads ?id= query parameter
*/

const SAMPLE_EVENTS = [
  {"id":"E1001","title":"AI & Society Conference","date":"2025-11-10","location":"Cairo Convention Center","category":"conference","description":"A conference about AI impacts.","numberOfSeats":200},
  {"id":"E1002","title":"Web Dev Workshop","date":"2025-10-28","location":"Giza Tech Hub","category":"workshop","description":"Hands-on workshop on modern web.","numberOfSeats":40},
  {"id":"E1003","title":"Campus Meetup","date":"2025-12-02","location":"AUC Campus","category":"meetup","description":"Student meetup for networking.","numberOfSeats":100}
];

// Utilities
function getEvents(){
  const stored = localStorage.getItem('events_v1');
  if(stored) try { return JSON.parse(stored); } catch(e){}
  localStorage.setItem('events_v1', JSON.stringify(SAMPLE_EVENTS));
  return SAMPLE_EVENTS.slice();
}
function saveEvents(arr){ localStorage.setItem('events_v1', JSON.stringify(arr)); }

function qs(q) { return document.querySelector(q); }
function qsa(q) { return document.querySelectorAll(q); }

document.addEventListener('DOMContentLoaded', ()=> {
  // populate sample events on home
  const sampleEl = qs('#sample-events');
  if(sampleEl){
    const events = getEvents().slice(0,3);
    sampleEl.innerHTML = events.map(ev => `
      <article class="event">
        <h3>${ev.title}</h3>
        <div class="meta">${ev.date} — ${ev.location} — ${ev.category}</div>
        <p>${ev.description}</p>
        <a class="card" href="event-detail.html?id=${encodeURIComponent(ev.id)}">View details</a>
      </article>
    `).join('');
  }

  // Events list page
  const eventsList = qs('#events-list');
  if(eventsList){
    const render = (list) => {
      eventsList.innerHTML = list.map(ev => `
        <article class="event">
          <h3>${ev.title} <small>(${ev.id})</small></h3>
          <div class="meta">${ev.date} • ${ev.location} • ${ev.category} • Seats: ${ev.numberOfSeats}</div>
          <p>${ev.description}</p>
          <a class="card" href="event-detail.html?id=${encodeURIComponent(ev.id)}">Details</a>
        </article>
      `).join('');
    };
    const all = getEvents();
    render(all);

    // Search form behaviour
    qs('#searchBtn').addEventListener('click', ()=>{
      const q = qs('#q').value.trim().toLowerCase();
      const date = qs('#date').value;
      const location = qs('#location').value.trim().toLowerCase();
      const category = qs('#category').value;
      const minSeats = parseInt(qs('#minSeats').value || '0',10);
      let filtered = getEvents().filter(ev=>{
        if(q){
          if(!(ev.id.toLowerCase().includes(q) || ev.title.toLowerCase().includes(q))) return false;
        }
        if(date && ev.date !== date) return false;
        if(location && !ev.location.toLowerCase().includes(location)) return false;
        if(category && ev.category !== category) return false;
        if(ev.numberOfSeats < minSeats) return false;
        return true;
      });
      render(filtered);
    });
    qs('#clearBtn').addEventListener('click', ()=>{
      qs('#q').value='';qs('#date').value='';qs('#location').value='';qs('#category').value='';qs('#minSeats').value='';
      render(getEvents());
    });
  }

  // Event detail page
  const detailEl = qs('#event-detail');
  if(detailEl){
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || '';
    const ev = getEvents().find(e=>e.id===id) || getEvents()[0];
    detailEl.innerHTML = `<h2>${ev.title} <small>(${ev.id})</small></h2>
      <div class="meta">${ev.date} • ${ev.location} • ${ev.category} • Seats: ${ev.numberOfSeats}</div>
      <p>${ev.description}</p>`;
    // Register form
    const regForm = qs('#register-form');
    regForm.addEventListener('submit', (evnt)=>{
      evnt.preventDefault();
      const fd = new FormData(regForm);
      const fullname = fd.get('fullname'), email = fd.get('email'), seats = parseInt(fd.get('seats'),10);
      if(!fullname || !email || seats<=0){ qs('#register-message').textContent='Please fill valid details.'; return; }
      // save registration
      const regs = JSON.parse(localStorage.getItem('regs_v1')||'[]');
      regs.push({eventId: ev.id, fullname, email, seats, status:'pending'});
      localStorage.setItem('regs_v1', JSON.stringify(regs));
      qs('#register-message').textContent = 'Registration submitted (status: pending).';
      regForm.reset();
    });
  }

  // Signup simulation
  const signupForm = qs('#signup-form');
  if(signupForm){
    signupForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(signupForm);
      const username = fd.get('username'), email = fd.get('email');
      const password = fd.get('password'), confirm = fd.get('confirm');
      const is_admin = fd.get('is_admin') ? true : false;
      if(password !== confirm){ qs('#signup-message').textContent='Passwords do not match.'; return; }
      const users = JSON.parse(localStorage.getItem('users_v1')||'[]');
      if(users.find(u=>u.username===username)){ qs('#signup-message').textContent='Username already exists.'; return; }
      users.push({username,email,password,is_admin});
      localStorage.setItem('users_v1', JSON.stringify(users));
      qs('#signup-message').textContent = 'Account created (simulation). You can now login.';
      signupForm.reset();
    });
  }

  // Login simulation
  const loginForm = qs('#login-form');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const username = fd.get('username'), password = fd.get('password');
      const users = JSON.parse(localStorage.getItem('users_v1')||'[]');
      const u = users.find(x=>x.username===username && x.password===password);
      if(!u){ alert('Invalid credentials (simulation). Use Signup to create account.'); return; }
      localStorage.setItem('session_v1', JSON.stringify({username:u.username,is_admin:!!u.is_admin}));
      alert('Logged in (simulation). In Phase 2 navigation will adapt. For now, manually open the admin or user navbar variant on pages.');
      loginForm.reset();
    });
  }

  // Admin add event
  const eventForm = qs('#event-form');
  if(eventForm){
    eventForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(eventForm);
      const title = fd.get('title'), date = fd.get('date'), location = fd.get('location'), category = fd.get('category');
      const desc = fd.get('description') || '', seats = parseInt(fd.get('numberOfSeats')||'0',10);
      if(!title||!date||!location||!category){ qs('#admin-message').textContent='Please fill required fields.'; return; }
      const events = getEvents();
      // generate new ID
      const maxId = events.reduce((m,it)=>{ const n = parseInt(it.id.replace(/[^0-9]/g,''))||0; return Math.max(m,n); },0);
      const newId = 'E'+(maxId+1);
      events.push({id:newId,title,date,location,category,description:desc,numberOfSeats:seats});
      saveEvents(events);
      qs('#admin-message').textContent = 'Event added (saved in browser storage).';
      eventForm.reset();
      // refresh admin events listing if present
      const adminEvents = qs('#admin-events');
      if(adminEvents){ adminEvents.innerHTML = events.map(ev=>`
         <article class="event"><h4>${ev.title} <small>(${ev.id})</small></h4>
         <div class="meta">${ev.date} • ${ev.location} • ${ev.category} • Seats: ${ev.numberOfSeats}</div>
         <p>${ev.description}</p>
         <button data-id="${ev.id}" class="delete-btn">Delete</button>
         </article>
      `).join('');
        // delete handlers
        adminEvents.querySelectorAll('.delete-btn').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const id = btn.getAttribute('data-id');
            const arr = getEvents().filter(x=>x.id!==id);
            saveEvents(arr);
            btn.closest('article').remove();
          });
        });
      }
    });
  }

  // Render admin events area
  const adminEvents = qs('#admin-events');
  if(adminEvents){
    const events = getEvents();
    adminEvents.innerHTML = events.map(ev=>`
         <article class="event"><h4>${ev.title} <small>(${ev.id})</small></h4>
         <div class="meta">${ev.date} • ${ev.location} • ${ev.category} • Seats: ${ev.numberOfSeats}</div>
         <p>${ev.description}</p>
         <button data-id="${ev.id}" class="delete-btn">Delete</button>
         </article>
    `).join('');
    adminEvents.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        const arr = getEvents().filter(x=>x.id!==id);
        saveEvents(arr);
        btn.closest('article').remove();
      });
    });
  }

  // Render my registrations page
  const myRegs = qs('#my-registrations');
  if(myRegs){
    const regs = JSON.parse(localStorage.getItem('regs_v1')||'[]');
    const events = getEvents();
    myRegs.innerHTML = regs.map(r=>{
      const ev = events.find(e=>e.id===r.eventId) || {title:'Unknown'};
      return `<article class="event"><h4>${ev.title} <small>(${r.eventId})</small></h4>
        <div class="meta">Name: ${r.fullname} • Seats: ${r.seats} • Status: ${r.status}</div></article>`;
    }).join('') || '<p>No registrations yet.</p>';
  }

});
