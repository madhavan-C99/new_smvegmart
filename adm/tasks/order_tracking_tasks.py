import logging
from huey.contrib.djhuey import task
from biz.services.order_tracking_service import (
    update_order_stage_and_notify,
    assign_delivery_boy_and_notify
)

logger = logging.getLogger(__name__)


@task()
def update_order_stage_task(order_id, new_status):
    try:
        logger.info(f"update_order_stage_task | order_id={order_id} | status={new_status}")
        update_order_stage_and_notify(order_id, new_status)
    except Exception as e:
        logger.error(f"update_order_stage_task_error | order_id={order_id} | err={str(e)}")


@task()
def assign_delivery_boy_task(order_id, delivery_boy_id):
    try:
        logger.info(f"assign_delivery_boy_task | order_id={order_id} | delivery_boy_id={delivery_boy_id}")
        assign_delivery_boy_and_notify(order_id, delivery_boy_id)
    except Exception as e:
        logger.error(f"assign_delivery_boy_task_error | order_id={order_id} | err={str(e)}")
