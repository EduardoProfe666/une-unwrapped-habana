![asd](/app/public/banner.png)

## ⚡ UNE Unwrapped

Como mismo Github, Spotify y Youtube tiene su propio resumen anual,
siempre pensé porque la UNE (Empresa Eléctrica) no puede tener el suyo propio

Para ello scrappee [el canal de Telegram de la UNE en La Habana](https://t.me/EmpresaElectricaDeLaHabana)
donde obtuve [el histórico de mensajes con metadatos](telegram_messages.db) del canal.

Luego cree un script para poder analizar dichos datos que resultó en [análisis anuales](/app/public/data/analysis_data_2025.json) en formato json 
en diversos aspectos.

Finalmente, desarrollé una página para mostrar dichos datos de forma más amigable.

Esta página esta disponible en [el siguiente enlace](https://une-unwrapped-habana.vercel.app)

> #### IMPORTANTE
> Los resumenes anuales de los datos extraídos no deben ser tomados
> como oficialmente válidos, pues no realizan un análisis profundo y correcto,
> sino que busca ciertos patrones en los mensajes. Tomarlos solo como entretenimiento.