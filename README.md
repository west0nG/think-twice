# Think Twice

A clickable prototype for ACAD 325. Think Twice lets Karen pay a routine bill independently and pauses a suspicious payment so Emily, her trusted contact, can make a decision.

## Try the two scenarios

1. **Routine payment.** In Karen’s view, choose **Pay electricity bill**, then **Pay $64.80**. A receipt appears immediately. Emily’s payment alerts stay empty.
2. **Suspicious text.** In Karen’s view, choose **Read text message**, open the demo link, and select **Pay $47.50**. The payment pauses before funds move. Switch to **Emily** and select **Review payment** to see the AI summary, risk classification, reasons, and original text. Decline the payment or approve it and confirm. Return to **Karen** to see the outcome.

Use **Reset demo** to start over. You can switch roles in one tab or open both roles in two tabs in the same browser profile. Demo state is stored locally in the browser.

## Run locally

From the repository root, run `python3 -m http.server 8080 --directory public` and open [localhost:8080](http://localhost:8080).

The prototype uses fictional data and scripted AI analysis. It simulates payment, alert delivery, and family review entirely in the browser.
