import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from huey.contrib.djhuey import task
from ..services import order_service
from ..services import delivery_agent_service

logger = logging.getLogger('django')


@task()
def fetch_all_order_task():
    try:
        order_data = order_service.get_all_orders_orm()
        agents_data = delivery_agent_service.fetch_all_delivery_agents_service()
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    "fetch_all_orders_group",
                    {
                        "type": "send_all_orders_data",
                        "data": order_data,
                        "agents": agents_data,
                    }
                )
            except Exception as layer_err:
                logger.warning(f"Could not broadcast orders via channel layer: {layer_err}")
        return order_data
    except Exception as e:
        logger.error(f"Error in fetch_all_order_task: {str(e)}", exc_info=True)
        return []
