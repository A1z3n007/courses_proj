// ЭЛЕМЕНТЫ
const characters = document.getElementById("characters");
const pupils = document.querySelectorAll(".pupil");

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const errorBox = document.getElementById("form-error");
const successBox = document.getElementById("form-success");
const loginBtn = document.querySelector(".btn--primary");

const MOOD_CLASSES = [
    "characters--idle",
    "characters--email",
    "characters--password",
    "characters--error",
    "characters--success",
    "characters--cta",
    "characters--typing"
];

function setMood(mood) {
    if (!characters) return;
    characters.classList.remove(...MOOD_CLASSES);
    characters.classList.add(`characters--${mood}`);
}

// лёгкое подпрыгивание при вводе
function bounceOnType() {
    if (!characters) return;
    characters.classList.add("characters--typing");
    setTimeout(() => {
        characters.classList.remove("characters--typing");
    }, 180);
}

// глаза следят за курсором
function handlePointerMove(event) {
    if (!pupils.length) return;

    pupils.forEach((pupil) => {
        const eye = pupil.parentElement;
        if (!eye) return;

        const rect = eye.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;

        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / distance;
        const ny = dy / distance;

        const maxOffsetX = 7;
        const maxOffsetY = 5;

        const offsetX = nx * maxOffsetX;
        const offsetY = ny * maxOffsetY;

        pupil.style.setProperty("--px", `${offsetX}px`);
        pupil.style.setProperty("--py", `${offsetY}px`);
    });
}

document.addEventListener("pointermove", handlePointerMove);

// ФОКУСЫ ПОЛЕЙ

emailInput.addEventListener("focus", () => {
    setMood("email");
});

emailInput.addEventListener("input", () => {
    if (document.activeElement === emailInput) {
        setMood("email");
        bounceOnType();
    }
});

passwordInput.addEventListener("focus", () => {
    setMood("password");
});

passwordInput.addEventListener("input", () => {
    if (document.activeElement === passwordInput) {
        setMood("password");
    }
});

// потеря фокуса обоих полей -> idle, если нет ошибок/успеха
function handleBlur() {
    setTimeout(() => {
        const isFocused =
            document.activeElement === emailInput ||
            document.activeElement === passwordInput;

        if (!isFocused) {
            setMood("idle");
        }
    }, 20);
}

emailInput.addEventListener("blur", handleBlur);
passwordInput.addEventListener("blur", handleBlur);

// hover по основной кнопке -> персонажи машут
if (loginBtn) {
    loginBtn.addEventListener("mouseenter", () => {
        // не перебиваем ошибку/успех
        if (characters.classList.contains("characters--error")) return;
        if (characters.classList.contains("characters--success")) return;
        setMood("cta");
    });

    loginBtn.addEventListener("mouseleave", () => {
        const isEmailFocused = document.activeElement === emailInput;
        const isPassFocused = document.activeElement === passwordInput;

        if (isEmailFocused) setMood("email");
        else if (isPassFocused) setMood("password");
        else setMood("idle");
    });
}

// ВАЛИДАЦИЯ ФОРМЫ

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let errorMessage = "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        errorMessage = "Введите корректный email.";
    } else if (password.length < 6) {
        errorMessage = "Пароль должен быть не короче 6 символов.";
    }

    if (errorMessage) {
        successBox.textContent = "";
        errorBox.textContent = errorMessage;

        setMood("error");

        setTimeout(() => {
            const isEmailFocused = document.activeElement === emailInput;
            const isPassFocused = document.activeElement === passwordInput;

            if (isEmailFocused) setMood("email");
            else if (isPassFocused) setMood("password");
            else setMood("idle");
        }, 800);
    } else {
        errorBox.textContent = "";
        successBox.textContent = "Nice! Characters are happy 🔓";

        setMood("success");

        setTimeout(() => {
            const isEmailFocused = document.activeElement === emailInput;
            const isPassFocused = document.activeElement === passwordInput;

            if (isEmailFocused) setMood("email");
            else if (isPassFocused) setMood("password");
            else setMood("idle");
        }, 1300);
    }
});

// стартовое состояние
setMood("idle");
