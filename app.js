/* Personalized four-week training planner - revised for Criterion C.
 * Educational beginner-planning prototype, not individual medical advice.
 * All date and client-feedback evidence must be verified by the student.
 */
"use strict";

// Goal -> array of workout templates. Each template stores named exercises, not
// a long comma-separated string, so tutorials are matched exactly.
const base = {
  gain_muscle: [
    { target: "Push", kind: "strength", exercises: ["Bench Press", "Overhead Press", "Tricep Extension"] },
    { target: "Pull", kind: "strength", exercises: ["Barbell Rows", "Lat Pulldown", "Bicep Curls"] },
    { target: "Legs", kind: "strength", exercises: ["Squats", "Leg Press", "Romanian Deadlift"] }
  ],
  lose_weight: [
    { target: "Full Body", kind: "circuit", exercises: ["Bodyweight Squats", "Push-ups", "Burpees"] },
    { target: "Cardio Circuit", kind: "circuit", exercises: ["Step-ups", "Mountain Climbers", "Bodyweight Squats"] },
    { target: "Core", kind: "circuit", exercises: ["Planks", "Russian Twists", "Bird-Dog"] }
  ],
  stay_healthy: [
    { target: "Mobility", kind: "mobility", exercises: ["Cat-Cow", "Bird-Dog", "Thoracic Rotations"] },
    { target: "Light Resistance", kind: "strength", exercises: ["Resistance Band Pull-aparts", "Step-ups"] },
    { target: "Gentle Movement", kind: "mobility", exercises: ["Downward Dog", "Cat-Cow", "Bird-Dog"] }
  ]
};

// Existing student-selected tutorial sources. Confirm every video still matches
// the named exercise before submitting the IA.
const exerciseVideos = {
  "Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "Overhead Press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
  "Tricep Extension": "https://www.youtube.com/watch?v=vB5OHsJ3EME",
  "Barbell Rows": "https://www.youtube.com/watch?v=DJpPullenyk",
  "Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "Bicep Curls": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "Squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
  "Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  "Romanian Deadlift": "https://www.youtube.com/watch?v=7j-2N9Q-1pA",
  "Push-ups": "https://www.youtube.com/watch?v=_l3ySVKYVJ8",
  "Burpees": "https://www.youtube.com/watch?v=qLBImHhCXSw",
  "Bodyweight Squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
  "Planks": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
  "Russian Twists": "https://www.youtube.com/watch?v=wkD8rjkodUI",
  "Mountain Climbers": "https://www.youtube.com/watch?v=nmwgirgXLYM",
  "Cat-Cow": "https://www.youtube.com/watch?v=kqnua4rHVVA",
  "Bird-Dog": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
  "Thoracic Rotations": "https://www.youtube.com/watch?v=2qZ517Rw7ME",
  "Resistance Band Pull-aparts": "https://www.youtube.com/watch?v=0K2P2kQkp0o",
  "Step-ups": "https://www.youtube.com/watch?v=dQqApCGd5Ss",
  "Downward Dog": "https://www.youtube.com/watch?v=6tmbeLTHC_0"
};

const goalLabels = {
  gain_muscle: "Gain muscle",
  lose_weight: "Lose weight",
  stay_healthy: "Stay healthy"
};
const genderLabels = {
  male: "Male", female: "Female", nonbinary: "Non-binary", undisclosed: "Prefer not to say"
};

/** Returns explicit validation failures; never rely on HTML 'required' alone. */
function validateValues(profile) {
  const errors = [];
  if (!Object.hasOwn(base, profile.objective)) errors.push("Choose a valid fitness goal.");
  if (!Object.hasOwn(genderLabels, profile.gender)) errors.push("Choose a gender option.");
  const numericRules = [
    ["height", 120, 220, "Height (cm)"],
    ["weight", 30, 300, "Weight (kg)"],
    ["age", 18, 80, "Age"],
    ["frequency", 1, 6, "Training days per week"]
  ];
  for (const [field, min, max, title] of numericRules) {
    const n = Number(profile[field]);
    if (profile[field] === "" || profile[field] == null || !Number.isFinite(n) || n < min || n > max ||
        ((field === "age" || field === "frequency") && !Number.isInteger(n))) {
      errors.push(`${title} must be ${field === "age" || field === "frequency" ? "a whole number" : "a number"} from ${min} to ${max}.`);
    }
  }
  return errors;
}

/** Height and weight BOTH contribute to BMI; BMI is used as a cautious heuristic. */
function calculateProfile(profile) {
  const errors = validateValues(profile);
  if (errors.length) throw new Error(errors.join(" "));
  const heightM = Number(profile.height) / 100;
  const bmi = Number(profile.weight) / (heightM * heightM);
  const bmiBand = bmi < 18.5 ? "below_reference" : bmi >= 30 ? "higher" : "middle";
  const ageBand = Number(profile.age) >= 50 ? "older_beginner" : "adult_beginner";
  return {
    ...profile,
    height: Number(profile.height), weight: Number(profile.weight),
    age: Number(profile.age), frequency: Number(profile.frequency),
    bmi: Math.round(bmi * 10) / 10, bmiBand, ageBand,
    lowerImpact: bmiBand === "higher" || ageBand === "older_beginner"
  };
}

/** Exercise selection depends on age band and BMI band, not gender stereotypes. */
function chooseExercises(template, calculated) {
  return template.exercises.map(name => {
    if (name === "Burpees" && calculated.lowerImpact) return "Step-ups";
    if (name === "Mountain Climbers" && calculated.lowerImpact) return "Bird-Dog";
    return name;
  });
}

/** Progressive overload: +2 repetitions in weeks 2/4, +1 set in weeks 3/4. */
function workloadForWeek(week, kind, calculated) {
  const rounds = (week >= 3 ? 3 : 2) - (calculated.lowerImpact ? 1 : 0);
  const reps = week % 2 === 0 ? 10 : 8;
  if (kind === "strength") return `${rounds} ${rounds === 1 ? "set" : "sets"} x ${reps} controlled reps per exercise`;
  if (kind === "mobility") return `${rounds} ${rounds === 1 ? "round" : "rounds"} x ${reps} gentle reps per movement`;
  return `${rounds} ${rounds === 1 ? "round" : "rounds"} x ${reps} reps per exercise (planks: 20 sec)`;
}

/** Four independent weeks: each week's sessions contain their own workload. */
function generateWorkouts(profile) {
  const calculated = calculateProfile(profile);
  const template = base[calculated.objective];
  const weeks = [];
  for (let week = 1; week <= 4; week++) {
    const sessions = [];
    for (let i = 0; i < calculated.frequency; i++) {
      const workout = template[i % template.length];
      sessions.push({
        day: i + 1,
        target: workout.target,
        exercises: chooseExercises(workout, calculated),
        setsReps: workloadForWeek(week, workout.kind, calculated)
      });
    }
    weeks.push({ week, sessions });
  }
  return { calculated, weeks };
}

/** This is text personalization only; gender never determines exercise ability. */
function profileDescription(p) {
  const context = {
    male: "Begin with manageable weights rather than prioritizing heavy loads.",
    female: "Resistance exercises can be scaled to your current strength.",
    nonbinary: "Select resistance and exercise variations for your current ability.",
    undisclosed: "Exercise intensity is based on your inputs, not on a gender assumption."
  };
  const notes = [];
  if (p.lowerImpact) notes.push("A reduced-volume, lower-impact entry point was selected.");
  if (p.bmiBand === "below_reference" && p.objective === "lose_weight") {
    notes.push("Check whether a weight-loss goal is appropriate with a qualified professional.");
  }
  notes.push(context[p.gender]);
  return notes.join(" ");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}

function renderPlan(result) {
  const p = result.calculated;
  const profileText = `<p class="profile-summary"><strong>Selected profile:</strong> ${escapeHTML(goalLabels[p.objective])} | ${escapeHTML(genderLabels[p.gender])} | ${p.age} years | ${p.height} cm | ${p.weight} kg | ${p.frequency} day(s) per week | BMI ${p.bmi} (screening heuristic)</p>`;
  const notes = `<p class="advisory">${escapeHTML(profileDescription(p))} These are general beginner examples, not medical or individualized training advice.</p>`;
  const weekly = result.weeks.map(({week, sessions}) => `<section class="week-block" aria-label="Week ${week}">
    <h2>Week ${week}</h2><div class="table-scroll"><table class="workout-table"><thead>
    <tr><th scope="col">Day</th><th scope="col">Target</th><th scope="col">Progression</th><th scope="col">Exercises</th></tr></thead><tbody>
    ${sessions.map(s => `<tr><td>Workout ${s.day}</td><td>${escapeHTML(s.target)}</td><td>${escapeHTML(s.setsReps)}</td><td>${escapeHTML(s.exercises.join(", "))}</td></tr>`).join("")}
    </tbody></table></div></section>`).join("");
  return `<h2>Your Personalized 4-Week Training Program</h2>${profileText}${notes}${weekly}`;
}

function tutorialLinks(result) {
  const names = new Set();
  result.weeks.forEach(w => w.sessions.forEach(s => s.exercises.forEach(n => names.add(n))));
  return `<h2>Exercise tutorial videos</h2><ul>${[...names].map(n => {
    const url = exerciseVideos[n];
    return url ? `<li><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(n)} tutorial</a></li>` : `<li>${escapeHTML(n)} - tutorial missing</li>`;
  }).join("")}</ul>`;
}

/** One A4 page per week prevents clipping in longer, six-day plans. */
async function downloadPlanPDF() {
  if (!window.html2canvas || !window.jspdf) throw new Error("PDF libraries are unavailable.");
  const sections = [...document.querySelectorAll(".week-block")];
  if (!sections.length) throw new Error("Generate a plan before downloading.");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < sections.length; i++) {
    if (i) pdf.addPage();
    const canvas = await window.html2canvas(sections[i], { scale: 2, backgroundColor: "#ffffff" });
    const maxW = pageWidth - 20, maxH = pageHeight - 20;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10,
      canvas.width * ratio, canvas.height * ratio);
    pdf.setFontSize(9);
    pdf.text(`Week ${i + 1} of 4`, 10, pageHeight - 5);
  }
  pdf.save("Workout-Plan.pdf");
}

function initializeWebsite() {
  const form = document.getElementById("fitnessForm");
  const status = document.getElementById("formStatus");
  document.getElementById("theme-toggle").addEventListener("change", e => {
    document.body.classList.toggle("dark-mode", e.target.checked);
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const profile = Object.fromEntries(["objective","gender","height","weight","age","frequency"]
      .map(id => [id, document.getElementById(id).value]));
    const errors = validateValues(profile);
    if (errors.length) {
      status.textContent = errors.join(" ");
      document.getElementById("workoutTableContainer").innerHTML = "";
      document.getElementById("exerciseVideosContainer").innerHTML = "";
      document.getElementById("extraButtons").hidden = true;
      return;
    }
    const result = generateWorkouts(profile);
    document.getElementById("workoutTableContainer").innerHTML = renderPlan(result);
    document.getElementById("exerciseVideosContainer").innerHTML = tutorialLinks(result);
    document.getElementById("extraButtons").hidden = false;
    status.textContent = "Four-week workout plan generated.";
  });
  document.getElementById("downloadPDF").addEventListener("click", async () => {
    try { await downloadPlanPDF(); }
    catch (error) { status.textContent = `PDF could not be generated: ${error.message}`; }
  });
  document.getElementById("openSpotify").addEventListener("click", () => {
    window.open("https://open.spotify.com/", "_blank", "noopener,noreferrer");
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeWebsite);
  else initializeWebsite();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { base, exerciseVideos, validateValues, calculateProfile, chooseExercises,
    workloadForWeek, generateWorkouts, profileDescription, renderPlan, tutorialLinks };
}
