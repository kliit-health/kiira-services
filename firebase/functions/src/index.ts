import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as cors from "cors";
import Stripe from "stripe";

// initialize firebase admin
try {
    admin.initializeApp();
} catch (err) {
    console.error(err);
}

interface ApiCreateCheckoutSessionRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    priceId: string;
    postalCode: string;
    successUrl: string;
    cancelUrl: string;
}

interface CreateCustomerAtKiiraRequest {
    firstName: string;
    lastName: string;
    phone: string;
    customer: Stripe.Response<Stripe.Customer>;
    postalCode: string;
}

interface CreateCustomerAtStripeRequest {
    email: string;
    stripe: Stripe;
}

interface CreateCustomerAtStripeResponse {
    customer: Stripe.Response<Stripe.Customer>;
}

interface CreateCheckoutAtStripeRequest {
    email: string;
    priceId: string;
    cancelUrl: string;
    successUrl: string;
    stripe: Stripe;
}

interface CreateCheckoutAtStripeResponse {
    url: string | null | undefined;
    statusCode: number;
}

// check to see if the specified email address already exists in kiira
async function verifyCustomerAtKiira(email: string): Promise<boolean> {
    try {
        const user = await admin.auth().getUserByEmail(email);
        return user.email == email;
    } catch (err) {
        return false;
    }
}

// create customer/user documents in kiira databases
async function createCustomerAtKiira(request: CreateCustomerAtKiiraRequest): Promise<void> {

    // create customer in kiira
    const kiiraCustomers = admin.firestore().collection('customers');
    const kiiraCustomer = kiiraCustomers.doc(request.customer.id);

    await kiiraCustomer.set({
        id: request.customer.id,
        createdAt: request.customer.created,
        profileInfo: {
            email: request.customer.email,
            firstName: request.firstName,
            lastName: request.lastName,
            phoneNumber: request.phone
        },
        address: {
            postalCode: request.postalCode
        }
    }, { merge: true });
}

// create customer in stripe
async function createCustomerAtStripe(request: CreateCustomerAtStripeRequest): Promise<CreateCustomerAtStripeResponse> {
    const stripeResponse = await request.stripe.customers.create({ email: request.email });

    return {
        customer: stripeResponse
    }
}

// create checkout session url at stripe
async function createCheckoutAtStripe(request: CreateCheckoutAtStripeRequest): Promise<CreateCheckoutAtStripeResponse> {
    const { cancelUrl, successUrl, email, priceId, stripe } = request;
    const starterPriceId = process.env.STRIPE_STARTER_ID;
    const starterCouponId = process.env.STRIPE_STARTER_COUPON_ID;

    // stripe checkout session parameters
    const params: Stripe.Checkout.SessionCreateParams = {
        cancel_url: cancelUrl,
        success_url: successUrl,
        customer_email: email,
        mode:  "subscription",
        payment_method_types: [ "card" ],
        line_items: [{ quantity: 1, price: priceId }],
        phone_number_collection: { enabled: true },
        billing_address_collection: "required"
    };

    if (priceId === starterPriceId) {
        params.discounts = [
            { coupon: starterCouponId }
        ];
    }

    const session = await stripe.checkout.sessions.create(params);

    return {
        url: session.url,
        statusCode: session.lastResponse.statusCode
    };
}

export const apiCreateCheckoutSession = functions.https.onRequest((req, res) => {
    cors({ origin: true })(req, res, async () => {
        const request: ApiCreateCheckoutSessionRequest = req.body;
        const { email, priceId, cancelUrl, successUrl, postalCode, phone, firstName, lastName } = request;
        
        try {
            const stripeToken = functions.config().stripe.token;
            const stripe = new Stripe(stripeToken, {
                apiVersion: "2020-08-27"
            });

            // verify customer in kiira
            const exists = await verifyCustomerAtKiira(email);

            if (exists) {
                res.send({
                    "error": {
                        "message": "This email is already registered with a Kiira account. Please register with a different email or login to your existing Kiira account."
                    }
                }).status(400);
            } else {
                // create customer in stripe
                const response = await createCustomerAtStripe({ email, stripe });

                // create customer in kiira
                await createCustomerAtKiira({
                    customer: response.customer,
                    postalCode,
                    firstName,
                    lastName,
                    phone
                });

                // create checkout in stripe
                const { url, statusCode } = await createCheckoutAtStripe({
                    email,
                    priceId,
                    cancelUrl,
                    successUrl,
                    stripe
                });

                res.send({ checkoutUrl: url }).status(statusCode);
            }
        } catch (err) {
            console.error(err);

            res.send({
                "error": {
                    "message": "There was an error trying to register with Kiira."
                }
            }).status(500);
        }
    });
});