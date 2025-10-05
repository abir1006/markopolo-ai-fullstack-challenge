from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import random
from datetime import datetime, timedelta
import uuid

app = FastAPI(title="Marketing Campaign AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class DataSource(BaseModel):
    name: str
    type: str
    status: str
    connected: bool
    config: Dict[str, Any] = {}

class Channel(BaseModel):
    name: str
    type: str
    enabled: bool
    config: Dict[str, Any] = {}

class ChatMessage(BaseModel):
    message: str
    data_sources: List[str]
    channels: List[str]

class CampaignRecommendation(BaseModel):
    campaign_id: str
    audience_segment: str
    channel: str
    message: str
    timing: str
    confidence_score: float
    data_insights: Dict[str, Any]
    execution_ready: bool

# Mock data storage
connected_data_sources = {}
enabled_channels = {}

# Sample data generators
def generate_audience_segments():
    segments = [
        "High-value returning customers",
        "Cart abandoners (24h)",
        "New visitors with high engagement",
        "Lapsed customers (30+ days)",
        "Mobile-first shoppers",
        "Weekend browsers",
        "Price-sensitive buyers",
        "Premium product enthusiasts"
    ]
    return random.choice(segments)

def generate_timing():
    timings = [
        "Immediately",
        "Within 2 hours",
        "Tomorrow 9 AM",
        "Next weekend",
        "During lunch hours (12-1 PM)",
        "Evening (6-8 PM)",
        "After payday (1st of month)",
        "Before weekend (Thursday-Friday)"
    ]
    return random.choice(timings)

def generate_message_content(channel: str, audience: str):
    messages = {
        "email": [
            f"Exclusive offer for {audience.lower()}! 20% off your next purchase",
            f"We miss you! Come back and save 15% on your favorite items",
            f"Limited time: Flash sale just for you!",
            f"Your cart is waiting... Complete your purchase with free shipping"
        ],
        "sms": [
            f"FLASH SALE: 25% off ends tonight! Use code SAVE25",
            f"Hi! Your favorite item is back in stock. Get it now!",
            f"⚡ 2 HOURS LEFT: Don't miss our biggest sale of the year",
            f"FREE shipping today only. Complete your order now!"
        ],
        "push": [
            f"Personalized recommendation ready for you!",
            f"Items in your wishlist are on sale now",
            f"New arrivals matching your style preferences",
            f"Special reward unlocked! Tap to claim"
        ],
        "whatsapp": [
            f"Hi! We noticed you were browsing. Need help finding something?",
            f"Great news! Your favorite brand just launched new items",
            f"Quick question: How was your recent purchase experience?",
            f"our cart expires soon. Secure your items now!"
        ]
    }
    return random.choice(messages.get(channel, ["Generic marketing message"]))

def generate_data_insights(data_sources: List[str]):
    insights = {}
    
    if "gtm" in data_sources:
        insights["gtm"] = {
            "page_views": random.randint(1000, 10000),
            "events_tracked": random.randint(50, 500),
            "conversion_rate": round(random.uniform(2.5, 8.5), 2),
            "top_pages": ["/product-category", "/checkout", "/homepage"]
        }
    
    if "facebook_pixel" in data_sources:
        insights["facebook_pixel"] = {
            "reach": random.randint(5000, 50000),
            "engagement_rate": round(random.uniform(3.2, 12.8), 2),
            "cost_per_click": round(random.uniform(0.5, 3.0), 2),
            "audience_overlap": round(random.uniform(15.0, 45.0), 2)
        }
    
    if "shopify" in data_sources:
        insights["shopify"] = {
            "orders": random.randint(100, 1000),
            "revenue": random.randint(10000, 100000),
            "avg_order_value": round(random.uniform(50.0, 200.0), 2),
            "top_products": ["Product A", "Product B", "Product C"]
        }
    
    return insights

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Marketing Campaign AI API"}

@app.get("/data-sources")
async def get_data_sources():
    available_sources = [
        DataSource(name="Google Tag Manager", type="gtm", status="available", connected=False),
        DataSource(name="Facebook Pixel", type="facebook_pixel", status="available", connected=False),
        DataSource(name="Shopify", type="shopify", status="available", connected=False)
    ]
    
    # Update connection status
    for source in available_sources:
        if source.type in connected_data_sources:
            source.connected = True
            source.status = "connected"
    
    return available_sources

@app.post("/data-sources/{source_type}/connect")
async def connect_data_source(source_type: str, config: Dict[str, Any] = {}):
    if source_type not in ["gtm", "facebook_pixel", "shopify"]:
        raise HTTPException(status_code=400, detail="Invalid data source type")
    
    # Simulate connection process
    await asyncio.sleep(1)
    
    connected_data_sources[source_type] = {
        "connected_at": datetime.now().isoformat(),
        "config": config,
        "status": "active"
    }
    
    return {"status": "connected", "source": source_type}

@app.get("/channels")
async def get_channels():
    available_channels = [
        Channel(name="Email", type="email", enabled=False),
        Channel(name="SMS", type="sms", enabled=False),
        Channel(name="Push Notifications", type="push", enabled=False),
        Channel(name="WhatsApp", type="whatsapp", enabled=False)
    ]
    
    # Update enabled status
    for channel in available_channels:
        if channel.type in enabled_channels:
            channel.enabled = True
    
    return available_channels

@app.post("/channels/{channel_type}/enable")
async def enable_channel(channel_type: str, config: Dict[str, Any] = {}):
    if channel_type not in ["email", "sms", "push", "whatsapp"]:
        raise HTTPException(status_code=400, detail="Invalid channel type")
    
    enabled_channels[channel_type] = {
        "enabled_at": datetime.now().isoformat(),
        "config": config,
        "status": "active"
    }
    
    return {"status": "enabled", "channel": channel_type}

@app.post("/chat/stream")
async def stream_campaign_recommendations(chat_message: ChatMessage):
    if not chat_message.data_sources:
        raise HTTPException(status_code=400, detail="No data sources selected")
    
    if not chat_message.channels:
        raise HTTPException(status_code=400, detail="No channels selected")
    
    async def generate_recommendations():
        # Initial response
        yield f"data: {json.dumps({'type': 'status', 'message': 'Analyzing your data sources...'})}\n\n"
        await asyncio.sleep(1)
        
        yield f"data: {json.dumps({'type': 'status', 'message': 'Processing customer segments...'})}\n\n"
        await asyncio.sleep(1)
        
        yield f"data: {json.dumps({'type': 'status', 'message': 'Generating campaign recommendations...'})}\n\n"
        await asyncio.sleep(1)
        
        # Generate 3-5 recommendations
        num_recommendations = random.randint(3, 5)
        
        for i in range(num_recommendations):
            audience = generate_audience_segments()
            channel = random.choice(chat_message.channels)
            message = generate_message_content(channel, audience)
            timing = generate_timing()
            confidence = round(random.uniform(75.0, 95.0), 1)
            
            recommendation = CampaignRecommendation(
                campaign_id=str(uuid.uuid4()),
                audience_segment=audience,
                channel=channel,
                message=message,
                timing=timing,
                confidence_score=confidence,
                data_insights=generate_data_insights(chat_message.data_sources),
                execution_ready=True
            )
            
            yield f"data: {json.dumps({'type': 'recommendation', 'data': recommendation.dict()})}\n\n"
            await asyncio.sleep(random.uniform(0.5, 1.5))
        
        # Summary
        summary = {
            "type": "summary",
            "message": f"Generated {num_recommendations} campaign recommendations based on your query.",
            "total_recommendations": num_recommendations,
            "data_sources_used": chat_message.data_sources,
            "channels_targeted": chat_message.channels
        }
        
        yield f"data: {json.dumps(summary)}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate_recommendations(), media_type="text/plain")

@app.post("/campaigns/execute/{campaign_id}")
async def execute_campaign(campaign_id: str):
    # Simulate campaign execution
    await asyncio.sleep(2)
    
    return {
        "campaign_id": campaign_id,
        "status": "executing",
        "estimated_reach": random.randint(1000, 10000),
        "estimated_completion": (datetime.now() + timedelta(hours=2)).isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)