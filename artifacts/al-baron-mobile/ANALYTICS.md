# Al-Baron Analytics Events

Replit automatically records pageviews for the published website. The app emits the following custom events through the safe analytics wrapper when Replit's tracker is available.

## Customer funnel

| Event name | Description |
| --- | --- |
| `account_opened` | A visitor opens the account area from the home screen. |
| `booking_cta_clicked` | A visitor starts booking from a home-screen call to action. |
| `booking_mode_selected` | A visitor chooses the live queue or scheduled appointment flow. |
| `booking_service_selected` | A visitor selects a service. |
| `booking_barber_selected` | A visitor chooses any available barber or a named barber. |
| `style_reference_selected` | A visitor selects or clears a style reference. |
| `profile_saved` | A profile update succeeds. |
| `queue_joined` | Joining the live queue succeeds. |
| `appointment_booked` | Creating a scheduled appointment succeeds. |
| `ticket_cancelled` | Cancelling a ticket succeeds. |
| `ticket_summoned` | A reminder or staff summon succeeds. |
| `whatsapp_opened` | A visitor opens a WhatsApp contact or reminder link. |
| `directions_opened` | A visitor opens the salon directions link. |

## Staff operations

| Event name | Description |
| --- | --- |
| `queue_advanced` | Advancing the live queue succeeds. |
| `walk_in_added` | Adding a walk-in customer succeeds. |
| `service_saved` | Creating or updating a service succeeds. |
| `service_hidden` | Hiding a service succeeds. |
| `shop_status_changed` | Changing the shop open/closed status succeeds. |

## Privacy

Event properties contain only aggregate dimensions such as booking mode, service duration, barber-choice category, surface, channel, and boolean state. Names, phone numbers, notes, ticket IDs, appointment IDs, and raw user-entered text are not sent.