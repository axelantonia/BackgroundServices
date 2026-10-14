package com.example.activity

import android.os.Bundle
import android.os.PersistableBundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import android.util.Log
import android.widget.Button
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    var counter = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        Log.v("LIFECYCLE", "onCreate Berjalan")

        val _btnTambah = findViewById<Button>(R.id.btnPlus)
        val _btnKurang = findViewById<Button>(R.id.btnMinus)
        val _tvCounter = findViewById<TextView>(R.id.tvCounter)

        counter = savedInstanceState?.getInt("counter_now") ?:0

        _tvCounter.setText(counter.toString())

        _btnTambah.setOnClickListener {
            counter++
            _tvCounter.text = counter.toString()
        }

        _btnKurang.setOnClickListener {
            counter--
            _tvCounter.text = counter.toString()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        Log.v("LIFECYCLE", "Save")
        super.onSaveInstanceState(outState)
    }

    override fun onStart() {
        Log.v("LIFECYCLE", "onStart Berjalan")
        super.onStart()
    }

    override fun onRestart() {
        Log.v("LIFECYCLE", "onRestart Berjalan")
        super.onRestart()
    }

    override fun onResume() {
        Log.v("LIFECYCLE", "onResume Berjalan")
        super.onResume()
    }

    override fun onPause() {
        Log.v("LIFECYCLE", "onPause Berjalan")
        super.onPause()
    }

    override fun onStop() {
        Log.v("LIFECYCLE", "onStop Berjalan")
        super.onStop()
    }
}