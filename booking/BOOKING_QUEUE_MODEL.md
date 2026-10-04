# Booking Queue Model

## Core principle
Each business has one live customer queue. Offline walk-ins and app bookings share the same queue/order. The platform does not maintain separate online and offline queues.

## App-slot policy
The business configures:
- queue range size (default 10)
- number of app-reserved positions per range
- exact reserved positions in each range

Example:
- range: 1-10
- app positions: 1
- reserved position: #5

If #5 is not booked by the configured cutoff / operating rule, the business can pass that position. It becomes available for the next eligible customer and must not block the queue.

The configuration can later be changed per business, service, staff member, day, or session.

## Queue number
Every customer receives a persistent queue number:
- booking_id
- queue_number
- queue_range
- source: APP | OFFLINE
- status: BOOKED | CHECKED_IN | SERVING | COMPLETED | PASSED | CANCELLED | NO_SHOW

The queue number is the customer-facing reference and must never silently change after confirmation.

## Estimated turn time
For each active queue position:
estimated_turn_at = current/service-start reference + sum of expected handling durations of customers ahead

The calculation uses the business-configured average handling time, with service-specific overrides where available.

Example:
- average handling time = 10 min
- customer #5
- customers #1-#4 ahead
- estimated turn = approximately 40 min from the current reference point

The UI must clearly label this as an estimate, not a guaranteed appointment time.

## Dynamic recalculation
Estimated time is recalculated whenever:
- a customer is added/removed
- a customer is passed
- a customer checks in
- service starts/completes
- average handling time changes
- business pauses/resumes queue
- staff availability changes

Customers ahead that are completed faster/slower automatically move the estimate.

## Notifications
Customer receives:
1. booking confirmation with queue number
2. estimated turn time
3. queue position
4. status-change notifications
5. approaching-turn notification
6. "your turn / please arrive" notification when the business reaches the configured threshold

Business can configure notification thresholds.

## Anti-double-booking / consistency
Queue assignment must be atomic. Two simultaneous bookings must never receive the same queue number. The final implementation should enforce uniqueness at database level, not only in frontend code.

## Recommended data model
businesses
services
staff
queue_settings
queue_sessions
queue_entries
bookings
customers
notifications

queue_settings:
- range_size
- app_slots_per_range
- reserved_positions
- average_handling_minutes
- approach_notification_minutes
- cutoff_minutes
- timezone

queue_entries:
- id
- session_id
- booking_id
- queue_number
- source
- status
- estimated_turn_at
- checked_in_at
- serving_started_at
- completed_at
- created_at

## Important distinction
A reserved app position is a capacity rule, not a promise that the business must wait for that customer. Unused reserved positions can be passed according to business rules so offline customers keep moving.

## Customer experience
The confirmation screen should show:
- "Your queue number: #5"
- "Estimated turn: 12:40 PM"
- "People ahead: 3"
- live status
- business address/contact
- check-in/arrival instructions

## Business experience
The live queue screen should show:
- current number being served
- next customers
- source badge (APP/OFFLINE)
- estimated times
- Pass / Call next / Serving / Complete actions
- ability to add offline customer
- ability to adjust handling-time estimate
- app-slot configuration

## Later extensions
The same queue engine can support clinics, salons, restaurants, diagnostics, repair/service centers and other businesses where customers are served sequentially.
