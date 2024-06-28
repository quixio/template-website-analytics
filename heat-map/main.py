import os
from quixstreams import Application

# for local dev, load env vars from a .env file
from dotenv import load_dotenv
load_dotenv()

app = Application(consumer_group="transformation-v1", auto_offset_reset="earliest")

input_topic = app.topic(os.environ["input"])
output_topic = app.topic(os.environ["output"])

sdf = app.dataframe(input_topic)

# put transformation logic here
# see docs for what you can do
# https://quix.io/docs/get-started/quixtour/process-threshold.html


def calculate_heat_map(data, state):

    mouse_overs = state.get('mouse_over', default=[])
    object_clicks = state.get('object_clicks', default=[])

    state_tag_mouse_overs = mouse_overs[data['events']['element']['tag']]
    if state_tag_mouse_overs == None:
        state_tag_mouse_overs = 0
    
    state_tag_mouse_overs += 1

    state.set('total', state_tag_mouse_overs)

    return {
        "avg_mouse_over": state_tag_mouse_overs,
        "avg_object_click": 0
    }

sdf = sdf.update(calculate_heat_map, stateful=True)
sdf = sdf.update(lambda row: print(row))

# sdf = sdf.to_topic(output_topic)

if __name__ == "__main__":
    app.run(sdf)