document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("register-form");

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener("submit", registerMerchant);

});


async function registerMerchant(event) {

    event.preventDefault();

    const firstName =
        document.getElementById("first-name").value.trim();

    const lastName =
        document.getElementById("last-name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirm-password").value;

    const message =
        document.getElementById("register-message");


    hideAuthMessage();


    if (password !== confirmPassword) {

        showAuthMessage(
            "Les deux mots de passe ne correspondent pas.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showAuthMessage(
            "Le mot de passe doit contenir au moins 6 caractères.",
            "error"
        );

        return;
    }


    showAuthMessage(
        "Création de ton compte...",
        "success"
    );


    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }

        });


    if (error) {

        console.error(error);

        showAuthMessage(
            "Erreur : " + error.message,
            "error"
        );

        return;
    }


    console.log("Compte créé :", data.user);


    showAuthMessage(
        "✅ Compte créé avec succès ! Vérifie ton adresse e-mail si Supabase te le demande.",
        "success"
    );


    registerForm.reset();


    setTimeout(() => {

        window.location.href = "login.html";

    }, 2500);

}


function showAuthMessage(text, type) {

    const message =
        document.getElementById("register-message");

    if (!message) {
        return;
    }

    message.textContent = text;

    message.className =
        "auth-message show " + type;
}


function hideAuthMessage() {

    const message =
        document.getElementById("register-message");

    if (!message) {
        return;
    }

    message.textContent = "";

    message.className = "auth-message";

}

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".password-toggle").forEach(button => {

        button.addEventListener("click", () => {

            const input =
                document.getElementById(button.dataset.target);

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "🙈";

            } else {

                input.type = "password";
                button.textContent = "👁️";

            }

        });

    });

});
