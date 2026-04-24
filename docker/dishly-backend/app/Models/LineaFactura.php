<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineaFactura extends Model
{
    protected $table = 'linea_factura';

    protected $primaryKey = 'id_linea_factura';

    public $timestamps = false;
}
