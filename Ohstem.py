from mqtt import *
from aiot_lcd1602 import LCD1602
from yolobit import *
button_a.on_pressed = None
button_b.on_pressed = None
button_a.on_pressed_ab = button_b.on_pressed_ab = -1
from machine import Pin, SoftI2C
from aiot_dht20 import DHT20
import time

aiot_lcd1602 = LCD1602()

aiot_dht20 = DHT20(SoftI2C(scl=Pin(22), sda=Pin(21)))

if True:
  mqtt.connect_wifi('wifine', '123456789')
  mqtt.connect_broker(server='test.mosquitto.org')
  aiot_lcd1602.clear()

while True:
  aiot_lcd1602.move_to(0, 0)
  aiot_lcd1602.putstr((round(translate((pin0.read_analog()), 0, 4095, 0, 100))))
  aiot_lcd1602.move_to(3, 0)
  aiot_lcd1602.putstr((aiot_dht20.dht20_temperature()))
  aiot_lcd1602.move_to(8, 0)
  aiot_lcd1602.putstr((aiot_dht20.dht20_humidity()))
  aiot_dht20.read_dht20()
  if (round(translate((pin2.read_analog()), 0, 4095, 0, 100))) < 50:
    aiot_lcd1602.move_to(0, 1)
    aiot_lcd1602.putstr('DARK AF')
  else:
    aiot_lcd1602.move_to(0, 1)
    aiot_lcd1602.putstr('URGGGGG')
  aiot_lcd1602.move_to(10, 1)
  aiot_lcd1602.putstr((round(translate((pin2.read_analog()), 0, 4095, 0, 100))))
  mqtt.publish('temperature', (aiot_dht20.dht20_temperature()))
  mqtt.publish('light', (round(translate((pin2.read_analog()), 0, 4095, 0, 100))))
  mqtt.publish('airHumidity', (aiot_dht20.dht20_humidity()))
  mqtt.publish('soilHumidity', (round(translate((pin0.read_analog()), 0, 4095, 0, 100))))
  time.sleep_ms(2000)
  aiot_lcd1602.clear()


aiot_dht20.dht20_temperature()

aiot_dht20.dht20_temperature()
