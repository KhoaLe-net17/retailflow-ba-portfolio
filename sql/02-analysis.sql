-- Q01: Remaining quantity per order line, excluding active reservations/completed returns.
SELECT ol.id, ol.purchased_qty,
       COUNT(ru.unit_id)::integer AS reserved_or_returned_qty,
       ol.purchased_qty - COUNT(ru.unit_id)::integer AS remaining_qty
FROM order_lines ol JOIN order_units ou ON ou.line_id = ol.id
LEFT JOIN return_units ru ON ru.unit_id = ou.id AND ru.active
GROUP BY ol.id ORDER BY ol.id;

-- Q02: Reconciliation queue at the deterministic demo clock; zero rows on clean seed.
SELECT ri.id, ri.status, ri.amount_vnd,
       EXTRACT(EPOCH FROM (TIMESTAMPTZ '2026-11-23T09:00:00Z' - ri.updated_at))/3600 AS age_hours
FROM refund_instructions ri WHERE ri.status IN ('PENDING','UNKNOWN') ORDER BY ri.updated_at;

-- Q03: Excess successful refunds per original order line; must return zero rows.
WITH paid AS (
 SELECT ou.line_id, SUM(ou.net_paid_vnd)::integer AS refunded_vnd
 FROM refund_instructions ri JOIN return_units ru ON ru.return_id=ri.return_id
 JOIN order_units ou ON ou.id=ru.unit_id
 WHERE ri.status='SUCCEEDED' GROUP BY ou.line_id
)
SELECT p.line_id,p.refunded_vnd,ol.net_paid_vnd
FROM paid p JOIN order_lines ol ON ol.id=p.line_id
WHERE p.refunded_vnd > ol.net_paid_vnd;

-- Q04: More than one successful attempt per logical refund; must return zero rows.
SELECT refund_id,COUNT(*) AS successful_attempts FROM payment_attempts
WHERE status='SUCCEEDED' GROUP BY refund_id HAVING COUNT(*) > 1;

-- Q05: Reconcile unit allocations to original paid totals; must return zero rows.
SELECT ol.id FROM order_lines ol JOIN order_units ou ON ou.line_id=ol.id
GROUP BY ol.id HAVING SUM(ou.net_paid_vnd) <> ol.net_paid_vnd OR COUNT(*) <> ol.purchased_qty;

-- Q06: Required audit fields; must return zero rows (also constrained by schema).
SELECT id FROM audit_events WHERE actor_id IS NULL OR created_at IS NULL OR action IS NULL;
