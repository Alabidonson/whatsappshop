/* =========================================================
   WHATSAPPSHOP — PAYMENT.JS
   Préparation du paiement SASPay
   ========================================================= */

const PAYMENT_PLANS = {
    basic: {
        name: "Basic",
        priceFCFA: 2000,
        productLimit: 50
    },

    pro: {
        name: "Pro",
        priceFCFA: 5000,
        productLimit: 200
    },

    premium: {
        name: "Premium",
        priceFCFA: 10000,
        productLimit: Infinity
    }
};

document.addEventListener("DOMContentLoaded", initPayment);


/* =========================================================
   INITIALISATION
   ========================================================= */

async function initPayment() {
    try {
        const params = new URLSearchParams(window.location.search);
        const planKey = String(
            params.get("plan") || ""
        ).toLowerCase();

        if (!PAYMENT_PLANS[planKey]) {
            showPaymentError(
                "Formule de paiement invalide."
            );
            return;
        }

        const plan = PAYMENT_PLANS[planKey];

        displayPlan(plan);

        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
            window.location.href = "login.html";
            return;
        }

        await checkCurrentSubscription(user.id, planKey);

        const paymentButton =
            document.getElementById("payment-button");

        if (!paymentButton) {
            console.error(
                "Bouton de paiement introuvable."
            );
            return;
        }

        paymentButton.addEventListener(
            "click",
            () => startPayment(user, planKey, plan)
        );

    } catch (error) {
        console.error(
            "Erreur initialisation paiement :",
            error
        );

        showPaymentError(
            "Une erreur est survenue lors du chargement du paiement."
        );
    }
}


/* =========================================================
   AFFICHAGE DE LA FORMULE
   ========================================================= */

function displayPlan(plan) {
    const nameElement =
        document.getElementById("payment-plan-name");

    const planLabelElement =
        document.querySelector("[data-payment-plan]");

    const priceElement =
        document.getElementById("payment-plan-price");

    const priceCurrencyElement =
        document.getElementById("payment-plan-price-usd");

    const limitElement =
        document.getElementById("payment-plan-limit");

    const paymentButton =
        document.getElementById("payment-button");

    if (nameElement) {
        nameElement.textContent = plan.name;
    }

    if (planLabelElement) {
        planLabelElement.textContent = plan.name;
    }

    if (priceElement) {
        priceElement.textContent =
            `${formatFCFA(plan.priceFCFA)} FCFA / mois`;
    }

    if (paymentButton) {
        paymentButton.textContent =
            `Payer ${formatFCFA(plan.priceFCFA)} FCFA`;
    }

    if (priceCurrencyElement) {
        priceCurrencyElement.textContent =
            "Facturation mensuelle en FCFA";
    }

    if (limitElement) {
        limitElement.textContent = Number.isFinite(plan.productLimit)
            ? `${plan.productLimit} produits maximum`
            : "Produits illimités";
    }
}


/* =========================================================
   VÉRIFICATION DE L'ABONNEMENT ACTUEL
   ========================================================= */

async function checkCurrentSubscription(
    userId,
    requestedPlan
) {
    const {
        data,
        error
    } = await supabaseClient
        .from("subscriptions")
        .select(
            "id, plan, status, price_usd, currency, expires_at, created_at"
        )
        .eq("user_id", userId)
        .in("status", ["active", "pending"])
        .order("created_at", {
            ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(
            "Erreur vérification abonnement :",
            error
        );
        return;
    }

    if (!data) {
        return;
    }

    let currentPlan =
        String(data.plan || "").toLowerCase();

    if (currentPlan === "business" || currentPlan === "enterprise") {
        currentPlan = "premium";
    }

    if (
        data.status === "active" &&
        currentPlan === requestedPlan
    ) {
        showPaymentMessage(
            `Tu possèdes déjà la formule ${capitalize(
                currentPlan
            )}.`
        );

        disablePaymentButton(
            "Abonnement déjà actif"
        );

        return;
    }

    if (data.status === "pending") {
        const createdAt = data.created_at
            ? new Date(data.created_at).getTime()
            : 0;

        const pendingAge = Date.now() - createdAt;
        const pendingExpiration = 30 * 60 * 1000; // 30 minutes

        if (
            createdAt &&
            Number.isFinite(createdAt) &&
            pendingAge < pendingExpiration
        ) {
            showPaymentMessage(
                "Un paiement est déjà en attente de confirmation."
            );

            disablePaymentButton(
                "Paiement déjà en attente"
            );

            return;
        }

        /*
         * Le paiement pending est ancien.
         * Le serveur pourra le clôturer comme expiré
         * lors de la création d'un nouveau checkout.
         */
    }
}


/* =========================================================
   DÉMARRER LE PAIEMENT
   ========================================================= */

async function startPayment(user, planKey, plan) {
    const paymentButton =
        document.getElementById("payment-button");

    if (!paymentButton) {
        return;
    }

    clearPaymentMessages();

    paymentButton.disabled = true;
    paymentButton.textContent =
        "Création du paiement...";

    try {
        const {
            data: {
                session
            },
            error: sessionError
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
            throw new Error(
                "Session utilisateur introuvable."
            );
        }

        const {
            data,
            error
        } = await supabaseClient.functions.invoke(
            "saspay-create-checkout",
            {
                body: {
                    plan: planKey
                }
            }
        );

        if (error) {
            console.error(
                "Erreur Edge Function :",
                error
            );

            throw new Error(
                "Impossible de créer le paiement."
            );
        }

        const returnedAmount = Number(data?.amount_xof);

        if (
            data?.plan !== planKey ||
            !Number.isFinite(returnedAmount) ||
            returnedAmount !== plan.priceFCFA
        ) {
            console.error(
                "Montant ou forfait retourné par la fonction de paiement incorrect :",
                data
            );

            throw new Error(
                `Le serveur a retourné un montant différent du forfait choisi. ` +
                `Aucun paiement n'a été lancé. Vérifie le déploiement de saspay-create-checkout.`
            );
        }

        if (!data?.checkout_url) {
            console.error(
                "Réponse inattendue :",
                data
            );

            throw new Error(
                "SasPay n'a pas fourni de lien de paiement."
            );
        }

        showPaymentMessage(
            "Redirection vers SasPay..."
        );

        window.location.href =
            data.checkout_url;

    } catch (error) {
        console.error(
            "Erreur lancement paiement :",
            error
        );

        showPaymentError(
            error.message ||
            "Impossible de préparer le paiement."
        );

        paymentButton.disabled = false;

        paymentButton.textContent =
            `Payer ${formatFCFA(
                plan.priceFCFA
            )} FCFA`;
    }
}


/* =========================================================
   AFFICHAGE DES MESSAGES
   ========================================================= */

function showPaymentMessage(message) {
    const element =
        document.getElementById("payment-message");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.display = "block";
}


function showPaymentError(message) {
    const element =
        document.getElementById("payment-error");

    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.display = "block";
}


function clearPaymentMessages() {
    const errorElement =
        document.getElementById("payment-error");

    const messageElement =
        document.getElementById("payment-message");

    if (errorElement) {
        errorElement.textContent = "";
        errorElement.style.display = "none";
    }

    if (messageElement) {
        messageElement.textContent = "";
        messageElement.style.display = "none";
    }
}


/* =========================================================
   BOUTON
   ========================================================= */

function disablePaymentButton(text) {
    const button =
        document.getElementById("payment-button");

    if (!button) {
        return;
    }

    button.disabled = true;
    button.textContent = text;
}


/* =========================================================
   UTILITAIRES
   ========================================================= */

function formatFCFA(value) {
    return Number(value || 0)
        .toLocaleString("fr-FR");
}


function capitalize(value) {
    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}