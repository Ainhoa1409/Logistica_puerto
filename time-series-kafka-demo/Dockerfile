FROM python:3.9.5
ENV REFRESHED_AT 2021-08-15


WORKDIR /home
ADD . /home
RUN pip install -r requirements.txt
RUN pip install pymongo

# Utiliza la imagen base oficial de MongoDB
FROM mongo

# Opcional: Configura variables de entorno si es necesario

# Copia archivos o scripts adicionales si es necesario

# Opcional: Expone el puerto si deseas acceder a MongoDB desde fuera del contenedor
EXPOSE 27017

# Ejecuta el comando para iniciar MongoDB cuando se inicie el contenedor
CMD ["mongod"]