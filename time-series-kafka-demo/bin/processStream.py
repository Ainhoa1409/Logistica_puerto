#!/usr/bin/env python

"""Consumes stream for printing all messages to the console.
"""

import argparse
import json
import sys
import time
import socket
from confluent_kafka import Consumer, KafkaError, KafkaException
from pymongo import MongoClient
import pymongo


def msg_process(msg, collection):
    # Print the current time and the message.
    time_start = time.strftime("%Y-%m-%d %H:%M:%S")
    val = msg.value()
    dval = json.loads(val)
    print(time_start, dval)

    # Almacenar el mensaje en MongoDB
    collection.insert_one(dval)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('topic', type=str, help='Name of the Kafka topic to stream.')
    args = parser.parse_args()

    running = True

    conf = {
        'bootstrap.servers': 'localhost:9092',  # Dirección y puerto de los servidores de Kafka
        'group.id': 'my-consumer-group',  # ID del grupo de consumidores
    }

    consumer = Consumer(conf)

    # Configurar la conexión a MongoDB
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["portdata"]
    print(client.list_database_names())
    collection = db["mycollection"]

    try:
        while running:
            consumer.subscribe([args.topic])

            msg = consumer.poll(1)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    sys.stderr.write('%% %s [%d] reached end at offset %d\n' %
                                     (msg.topic(), msg.partition(), msg.offset()))
                elif msg.error().code() == KafkaError.UNKNOWN_TOPIC_OR_PART:
                    sys.stderr.write('Topic unknown, creating %s topic\n' %
                                     (args.topic))
                elif msg.error():
                    raise KafkaException(msg.error())
            else:
                msg_process(msg, collection)

    except KeyboardInterrupt:
        pass

    finally:
        # Close down consumer to commit final offsets.
        consumer.close()


if __name__ == "__main__":
    main()
