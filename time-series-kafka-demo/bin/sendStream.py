#!/usr/bin/env python

"""Generates a stream to Kafka from a time series csv file.
"""

import argparse
import csv
import json
import socket
import sys
import time
from datetime import datetime
from dateutil import parser as date_parser
from confluent_kafka import Producer

def acked(err, msg):
    if err is not None:
        print("Failed to deliver message: %s: %s" % (str(msg.value()), str(err)))
    else:
        print("Message produced: %s" % (str(msg.value())))

def parse_date(date_str):
    return datetime.strptime(date_str, '%d/%m/%Y %H:%M')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data_filename', type=str, help='Time series csv file.')
    parser.add_argument('OE_filename', type=str, help='CSV file for OE.')
    parser.add_argument('AnunciosArribo_filename', type=str, help='CSV file for Anuncios de Arribo.')
    parser.add_argument('topic', type=str, help='Name of the Kafka topic to stream.')
    parser.add_argument('--speed', type=float, default=1, required=False, help='Speed up time series by a given multiplicative factor.')
    args = parser.parse_args()

    topic = args.topic

    conf = {'bootstrap.servers': "localhost:9092",
            'client.id': socket.gethostname()}
    producer = Producer(conf)

    with open(args.OE_filename, 'r') as oe_file:
        oe_reader = csv.reader(oe_file, delimiter=';')
        oe_lookup = {}
        next(oe_reader)  # Skip header
        for row in oe_reader:
            oe_lookup[row[0]] = row[1]  # ID container -> Puerto destino

    with open(args.AnunciosArribo_filename, 'r') as anuncios_file:
        anuncios_reader = csv.reader(anuncios_file, delimiter=';')
        anuncios_lookup = {}
        next(anuncios_reader)  # Skip header
        for row in anuncios_reader:
            anuncios_lookup[row[4]] = row[1]  # Puerto destino -> Nombre del buque

    with open(args.data_filename, 'r') as data_file:
        data_reader = csv.reader(data_file, delimiter=';')
        next(data_reader)  # Skip header
        first_line = True

        for row in data_reader:
            time_arrival = datetime.strptime(row[0], '%d/%m/%Y %H:%M')
            ID_Container = row[1]

            if first_line:
                ubicacion = row[2]
                Bloque = row[3]
                Bahia = row[4]
                Altura = row[5]
                Pila = row[6]
                PuertoDestino = oe_lookup.get(ID_Container, '')
                Peso = oe_lookup.get(ID_Container, '')
                NombreBuque = anuncios_lookup.get(PuertoDestino, '')

                result = {
                    "ID_Container": ID_Container,
                    "Peso": Peso,
                    "Ubicacion": ubicacion,
                    "Bloque": Bloque,
                    "Bahia": Bahia,
                    "Altura": Altura,
                    "Pila": Pila,
                    "TimeArrival": time_arrival.strftime('%d/%m/%Y %H:%M'),
                    "PuertoDestino": PuertoDestino,
                    "NombreBuque": NombreBuque
                }

                jresult = json.dumps(result)

                producer.produce(topic, value=jresult, callback=acked)

                first_line = False
            else:
                time.sleep(2 * args.speed)  # Simulated crane movement time

                ubicacion = row[2]
                Bloque = row[3]
                Bahia = row[4]
                Altura = row[5]
                Pila = row[6]
                PuertoDestino = oe_lookup.get(ID_Container, '')
                Peso = oe_lookup.get(ID_Container, '')
                NombreBuque = anuncios_lookup.get(PuertoDestino, '')

                result = {
                    "ID_Container": ID_Container,
                    "Peso": Peso,
                    "Ubicacion": ubicacion,
                    "Bloque": Bloque,
                    "Bahia": Bahia,
                    "Altura": Altura,
                    "Pila": Pila,
                    "TimeArrival": time_arrival.strftime('%d/%m/%Y %H:%M'),
                    "PuertoDestino": PuertoDestino,
                    "NombreBuque": NombreBuque
                }

                jresult = json.dumps(result)

                producer.produce(topic, value=jresult, callback=acked)

    producer.flush()

if __name__ == "__main__":
    main()