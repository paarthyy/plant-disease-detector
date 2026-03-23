import tensorflow as tf
from tensorflow.keras import layers

class AFpM(layers.Layer):
    def __init__(self, **kwargs):
        super(AFpM, self).__init__(**kwargs)

    def build(self, input_shape):
        n = input_shape[-1] if input_shape[-1] is not None else 1
        self.p = self.add_weight(
            name='p', shape=(n,),
            initializer=tf.keras.initializers.GlorotNormal(),
            trainable=True
        )
        super(AFpM, self).build(input_shape)

    def call(self, z):
        mish = z * tf.math.tanh(tf.math.log(
            1.0 + tf.exp(tf.clip_by_value(z, -88.0, 88.0))
        ))
        return tf.where(z >= 0, mish + self.p,
                        tf.ones_like(z) * self.p)

    def get_config(self):
        return super(AFpM, self).get_config()